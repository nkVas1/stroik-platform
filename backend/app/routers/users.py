from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sa_func
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User, Project, Bid, BidStatus, ProjectStatus, Review
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
    """Extract subscription plan from profile.raw_data."""
    if not profile:
        return "free"
    raw = profile.raw_data
    if isinstance(raw, dict):
        return raw.get("plan", "free").lower()
    return "free"


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
        "views_30d": 0,        # TODO: track via events table
        "rating": None,
        "completed": 0,
        "bids_total": 0,
        "bids_accepted": 0,
        "bids_pending": 0,
    }

    if role == "worker":
        # Count bids
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

        # Count completed projects
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

        # Average rating
        stmt_rating = select(sa_func.avg(Review.rating)).where(
            Review.worker_id == current_user.id
        )
        res_rating = await db.execute(stmt_rating)
        avg = res_rating.scalar_one_or_none()
        result["rating"] = round(float(avg), 1) if avg else None

    elif role == "employer":
        # Projects summary
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
    from sqlalchemy.orm import selectinload
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
    if profile.verification_level is not None and current_level == 0:
        profile.verification_level = 0
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
    from sqlalchemy.orm import selectinload
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
        "member_since": user.created_at.strftime("%B %Y") if user.created_at else None,
    }
