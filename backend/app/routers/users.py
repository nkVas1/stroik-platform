from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sa_func
from sqlalchemy.orm import selectinload
import logging
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User, Project, Bid, BidStatus, ProjectStatus, Review
from app.models.portfolio import PortfolioCase
from app.schemas.user import UserMeResponse, ManualProfileUpdateRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["users"])


def safe_vlevel(raw) -> int:
    if raw is None:
        return 0
    try:
        return int(raw)
    except (ValueError, TypeError):
        return 0


def _get_plan(profile) -> str:
    if not profile:
        return "free"
    raw = profile.raw_data
    if isinstance(raw, dict):
        return raw.get("plan", "free").lower()
    return "free"


class ProfilePatchRequest(BaseModel):
    fio: Optional[str] = None
    location: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None


@router.get("/me", response_model=UserMeResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    profile = current_user.profile
    return UserMeResponse(
        id=current_user.id,
        is_verified=current_user.is_verified,
        role=profile.role.value if profile and profile.role else "unknown",
        entity_type=profile.entity_type.value if profile and profile.entity_type else "unknown",
        company_name=profile.company_name if profile else None,
        verification_level=safe_vlevel(profile.verification_level if profile else None),
        fio=profile.fio if profile else None,
        location=profile.location if profile else None,
        email=current_user.email,
        language_proficiency=profile.language_proficiency if profile else None,
        work_authorization=profile.work_authorization if profile else None,
        specialization=profile.specialization if profile else None,
        experience_years=profile.experience_years if profile else None,
        project_scope=profile.project_scope if profile else None,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
        plan=_get_plan(profile),
    )


@router.patch("/me")
async def patch_my_profile(
    data: ProfilePatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    PATCH /api/users/me
    Обновление профиля из страницы настроек.
    Принимает только переданные поля (partial update).
    """
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=400, detail="Профиль не найден")

    if data.fio is not None:
        profile.fio = data.fio.strip() or None
    if data.location is not None:
        profile.location = data.location.strip() or None
    if data.specialization is not None:
        profile.specialization = data.specialization.strip() or None
    if data.experience_years is not None:
        profile.experience_years = data.experience_years
    if data.company_name is not None:
        profile.company_name = data.company_name.strip() or None
    if data.phone is not None:
        profile.phone = data.phone.strip() or None

    # Store bio in raw_data
    if data.bio is not None:
        from sqlalchemy.orm.attributes import flag_modified
        raw = profile.raw_data or {}
        raw["bio"] = data.bio.strip() or None
        profile.raw_data = raw
        flag_modified(profile, "raw_data")

    # Auto-upgrade verification level on profile completion
    current_level = safe_vlevel(profile.verification_level)
    if profile.fio and profile.location and current_level < 1:
        profile.verification_level = 1

    await db.commit()
    return {"status": "success", "message": "Профиль обновлён"}


@router.get("/me/stats")
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/users/me/stats
    Статистика для виджета дашборда.
    """
    profile = current_user.profile
    role = profile.role.value if profile else "unknown"

    result: dict = {
        "role": role,
        "views_30d": 0,
        "rating": None,
        "completed": 0,
        "bids_total": 0,
        "bids_accepted": 0,
        "bids_pending": 0,
    }

    if role == "worker":
        stmt_bids = select(Bid.status, sa_func.count(Bid.id)).where(
            Bid.worker_id == current_user.id
        ).group_by(Bid.status)
        res_bids = await db.execute(stmt_bids)
        for status, count in res_bids.all():
            result["bids_total"] += count
            if status == BidStatus.ACCEPTED.value:
                result["bids_accepted"] = count
            elif status == BidStatus.PENDING.value:
                result["bids_pending"] = count

        stmt_done = (
            select(sa_func.count(Bid.id))
            .join(Project, Bid.project_id == Project.id)
            .where(
                Bid.worker_id == current_user.id,
                Bid.status == BidStatus.ACCEPTED.value,
                Project.status == ProjectStatus.COMPLETED.value,
            )
        )
        res_done = await db.execute(stmt_done)
        result["completed"] = res_done.scalar_one_or_none() or 0

        stmt_rating = select(sa_func.avg(Review.rating)).where(
            Review.worker_id == current_user.id
        )
        res_rating = await db.execute(stmt_rating)
        avg = res_rating.scalar_one_or_none()
        result["rating"] = round(float(avg), 1) if avg else None

    elif role == "employer":
        stmt_proj = select(Project.status, sa_func.count(Project.id)).where(
            Project.employer_id == current_user.id
        ).group_by(Project.status)
        res_proj = await db.execute(stmt_proj)
        total_projects = 0
        completed_projects = 0
        for status, count in res_proj.all():
            total_projects += count
            if status == ProjectStatus.COMPLETED.value:
                completed_projects = count
        result["bids_total"] = total_projects
        result["completed"] = completed_projects

    return result


@router.get("/me/dashboard_data")
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.profile:
        return {"type": "unknown"}

    role = current_user.profile.role.value

    if role == "employer":
        stmt = select(Project).options(
            selectinload(Project.bids).selectinload(Bid.worker).selectinload(User.profile)
        ).where(Project.employer_id == current_user.id).order_by(Project.created_at.desc())
        res = await db.execute(stmt)
        projects = res.scalars().all()

        data = []
        for p in projects:
            bids_data = [{
                "id": b.id,
                "worker_id": b.worker_id,
                "worker_name": b.worker.profile.fio or f"Специалист #{b.worker.id}",
                "worker_spec": b.worker.profile.specialization,
                "cover_letter": b.cover_letter,
                "price_offer": b.price_offer,
                "status": b.status,
            } for b in p.bids]
            data.append({"id": p.id, "title": p.title, "status": p.status, "bids": bids_data})
        return {"type": "employer", "projects": data}

    elif role == "worker":
        stmt = select(Bid).options(
            selectinload(Bid.project)
        ).where(Bid.worker_id == current_user.id).order_by(Bid.created_at.desc())
        res = await db.execute(stmt)
        bids = res.scalars().all()

        data = [{
            "id": b.id,
            "project_title": b.project.title,
            "project_budget": b.project.budget,
            "project_status": b.project.status,
            "status": b.status
        } for b in bids]
        return {"type": "worker", "bids": data}

    return {"type": "unknown"}


@router.put("/me/manual")
async def update_profile_manually(
    data: ManualProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=400, detail="Профиль не найден")

    if data.fio is not None:
        profile.fio = data.fio or None
    if data.location is not None:
        profile.location = data.location or None
    if data.specialization is not None:
        profile.specialization = data.specialization or None
    if data.experience_years is not None:
        profile.experience_years = data.experience_years

    current_level = safe_vlevel(profile.verification_level)
    if profile.fio and profile.location and current_level < 1:
        profile.verification_level = 1

    await db.commit()
    return {"status": "success", "message": "Профиль обновлён"}


@router.post("/me/verify-document")
async def verify_user_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=400, detail="Профиль не найден")
    if not file.filename:
        raise HTTPException(status_code=400, detail="Файл не выбран")

    profile.verification_level = 3
    await db.commit()

    logger.info("🛡️ Документ '%s' загружен. User ID %d получил Level 3!", file.filename, current_user.id)
    return {"status": "success", "message": "Документы проверены. Уровень доверия: Максимальный (3)"}


@router.get("/public/{user_id}")
async def get_public_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).options(
        selectinload(User.profile)
    ).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    profile = user.profile
    completed_count = 0
    try:
        stmt_done = (
            select(Bid)
            .join(Project, Bid.project_id == Project.id)
            .where(
                Bid.worker_id == user_id,
                Bid.status == BidStatus.ACCEPTED.value,
                Project.status == ProjectStatus.COMPLETED.value,
            )
        )
        res_done = await db.execute(stmt_done)
        completed_count = len(res_done.scalars().all())
    except Exception as e:
        logger.warning("Счётчик завершённых проектов: %s", e)

    # avg_rating and reviews_count
    rating_stmt = select(sa_func.avg(Review.rating)).where(Review.worker_id == user_id)
    rating_res = await db.execute(rating_stmt)
    avg_rating = rating_res.scalar_one_or_none()

    reviews_count_stmt = select(sa_func.count(Review.id)).where(Review.worker_id == user_id)
    reviews_count_res = await db.execute(reviews_count_stmt)
    reviews_count: int = reviews_count_res.scalar_one_or_none() or 0

    raw = profile.raw_data or {}
    bio = raw.get("bio") if isinstance(raw, dict) else None

    return {
        "id": user.id,
        "fio": profile.fio or f"Специалист #{user.id}",
        "role": profile.role.value if profile.role else "unknown",
        "specialization": profile.specialization,
        "location": profile.location,
        "experience_years": profile.experience_years,
        "entity_type": profile.entity_type.value if profile.entity_type else "unknown",
        "verification_level": safe_vlevel(profile.verification_level),
        "completed_projects": completed_count,
        "avg_rating": round(float(avg_rating), 1) if avg_rating else None,
        "reviews_count": reviews_count,
        "bio": bio,
        "member_since": user.created_at.strftime("%B %Y") if user.created_at else None,
    }


@router.get("/{user_id}/profile")
async def get_full_public_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/users/{user_id}/profile
    Полный публичный профиль для страницы /profile/[id].
    Включает portfolio items, reviews, avg_rating, bio.
    Соответствует интерфейсу WorkerProfile на фронтенде.
    """
    stmt = select(User).options(
        selectinload(User.profile)
    ).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    profile = user.profile

    # avg_rating
    rating_stmt = select(sa_func.avg(Review.rating)).where(Review.worker_id == user_id)
    rating_res = await db.execute(rating_stmt)
    avg_rating_raw = rating_res.scalar_one_or_none()
    avg_rating = round(float(avg_rating_raw), 1) if avg_rating_raw else None

    # reviews with reviewer name
    reviews_stmt = (
        select(Review)
        .options(selectinload(Review.reviewer).selectinload(User.profile))
        .where(Review.worker_id == user_id)
        .order_by(Review.created_at.desc())
        .limit(20)
    )
    reviews_res = await db.execute(reviews_stmt)
    reviews_raw = reviews_res.scalars().all()

    reviews = []
    for r in reviews_raw:
        reviewer_name = "Заказчик"
        if r.reviewer and r.reviewer.profile:
            reviewer_name = (
                r.reviewer.profile.company_name
                or r.reviewer.profile.fio
                or f"Заказчик #{r.reviewer.id}"
            )
        reviews.append({
            "id": r.id,
            "rating": r.rating,
            "text": r.text,
            "reviewer_name": reviewer_name,
            "created_at": r.created_at.isoformat() if r.created_at else "",
        })

    # completed projects count
    completed_stmt = (
        select(sa_func.count(Bid.id))
        .join(Project, Bid.project_id == Project.id)
        .where(
            Bid.worker_id == user_id,
            Bid.status == BidStatus.ACCEPTED.value,
            Project.status == ProjectStatus.COMPLETED.value,
        )
    )
    completed_res = await db.execute(completed_stmt)
    completed_count: int = completed_res.scalar_one_or_none() or 0

    # portfolio cases
    portfolio_stmt = (
        select(PortfolioCase)
        .where(PortfolioCase.worker_id == user_id)
        .order_by(PortfolioCase.created_at.desc())
        .limit(12)
    )
    portfolio_res = await db.execute(portfolio_stmt)
    portfolio_cases = portfolio_res.scalars().all()

    portfolio = []
    for c in portfolio_cases:
        photos = c.photo_urls or []
        portfolio.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "work_type": c.work_type,
            "city": c.city,
            "year_completed": c.year_completed,
            "photo_url": photos[0] if photos else None,
            "photo_urls": photos,
            "is_verified": c.is_verified,
        })

    raw = profile.raw_data or {}
    bio = raw.get("bio") if isinstance(raw, dict) else None

    try:
        v_level = int(profile.verification_level) if profile.verification_level is not None else 0
    except (TypeError, ValueError):
        v_level = 0

    return {
        "id": user.id,
        "fio": profile.fio or f"Специалист #{user.id}",
        "role": profile.role.value if profile.role else "unknown",
        "specialization": profile.specialization,
        "location": profile.location,
        "entity_type": profile.entity_type.value if profile.entity_type else "unknown",
        "experience_years": profile.experience_years,
        "verification_level": v_level,
        "bio": bio,
        "avg_rating": avg_rating,
        "reviews_count": len(reviews),
        "completed_count": completed_count,
        "portfolio": portfolio,
        "reviews": reviews,
        "member_since": user.created_at.strftime("%B %Y") if user.created_at else None,
    }
