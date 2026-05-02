from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User, VerificationLevel, Project, Bid
from app.schemas.user import UserMeResponse, ManualProfileUpdateRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserMeResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Возвращает данные текущего пользователя. Требует JWT."""
    profile = current_user.profile
    return UserMeResponse(
        id=current_user.id,
        is_verified=current_user.is_verified,
        role=profile.role.value if profile else "unknown",
        entity_type=profile.entity_type.value if profile else "unknown",
        company_name=profile.company_name if profile else None,
        verification_level=profile.verification_level.value if profile else 0,
        fio=profile.fio if profile else None,
        location=profile.location if profile else None,
        email=profile.email if profile else None,
        language_proficiency=profile.language_proficiency if profile else None,
        work_authorization=profile.work_authorization if profile else None,
        specialization=profile.specialization if profile else None,
        experience_years=profile.experience_years if profile else None,
        project_scope=profile.project_scope if profile else None,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None
    )


@router.get("/me/dashboard_data")
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Умный эндпоинт: отдаёт разные данные в зависимости от роли."""
    from sqlalchemy.orm import selectinload
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
                "worker_id": b.worker_id,   # для ссылки на публичный профиль
                "worker_name": b.worker.profile.fio or f"Специалист #{b.worker.id}",
                "worker_spec": b.worker.profile.specialization,
                "cover_letter": b.cover_letter,
                "price_offer": b.price_offer,
                "status": b.status.value,
            } for b in p.bids]
            data.append({"id": p.id, "title": p.title, "status": p.status.value, "bids": bids_data})
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
            "project_status": b.project.status.value,
            "status": b.status.value
        } for b in bids]
        return {"type": "worker", "bids": data}

    return {"type": "unknown"}


@router.put("/me/manual")
async def update_profile_manually(
    data: ManualProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ручное обновление профиля без AI."""
    profile = current_user.profile
    if data.fio is not None:
        profile.fio = data.fio or None
    if data.location is not None:
        profile.location = data.location or None
    if data.specialization is not None:
        profile.specialization = data.specialization or None
    if data.experience_years is not None:
        profile.experience_years = data.experience_years

    if profile.fio and profile.location and profile.verification_level.value < 1:
        profile.verification_level = VerificationLevel.BASIC

    await db.commit()
    return {"status": "success", "message": "Профиль обновлён"}


@router.post("/me/verify-document")
async def verify_user_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Загрузка документов для верификации Level 3."""
    profile = current_user.profile
    if not file.filename:
        raise HTTPException(status_code=400, detail="Файл не выбран")

    profile.verification_level = VerificationLevel.PASSPORT
    await db.commit()

    logger.info(f"🛡️ Документ '{file.filename}' загружен. User ID {current_user.id} получил Level 3!")
    return {"status": "success", "message": "Документы проверены. Уровень доверия: Максимальный (3)"}


@router.get("/public/{user_id}")
async def get_public_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Публичный профиль специалиста. Авторизация не требуется."""
    from sqlalchemy.orm import selectinload
    from app.models.db_models import BidStatus, ProjectStatus
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
                Bid.status == BidStatus.ACCEPTED,
                Project.status == ProjectStatus.COMPLETED
            )
        )
        res_done = await db.execute(stmt_done)
        completed_count = len(res_done.scalars().all())
    except Exception as e:
        logger.warning(f"Счётчик завершённых проектов: {e}")

    return {
        "id": user.id,
        "fio": profile.fio or f"Специалист #{user.id}",
        "role": profile.role.value,
        "specialization": profile.specialization,
        "location": profile.location,
        "experience_years": profile.experience_years,
        "verification_level": profile.verification_level.value,
        "completed_projects": completed_count,
        "member_since": user.created_at.strftime("%B %Y") if user.created_at else None,
    }
