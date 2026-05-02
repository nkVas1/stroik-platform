from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User, Project, Bid, BidStatus, ProjectStatus
from app.schemas.project import BidCreateRequest, ProjectCreateRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["projects"])


@router.get("/projects")
async def get_projects(db: AsyncSession = Depends(get_db)):
    """Лента актуальных открытых заказов для работников."""
    try:
        stmt = (
            select(Project)
            .options(selectinload(Project.employer).selectinload(User.profile))
            .where(Project.status == ProjectStatus.OPEN.value)
            .order_by(Project.created_at.desc())
            .limit(50)
        )
        result = await db.execute(stmt)
        projects = result.scalars().all()

        return [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "budget": p.budget,
                "specialization": p.required_specialization,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "employer_name": (
                    p.employer.profile.company_name
                    or p.employer.profile.fio
                    or f"Заказчик #{p.employer.id}"
                ) if p.employer and p.employer.profile else f"Заказчик #{p.employer_id}",
                "location": (
                    p.employer.profile.location or "Город не указан"
                ) if p.employer and p.employer.profile else "Город не указан",
            }
            for p in projects
        ]
    except Exception as exc:
        logger.error("❌ Ошибка загрузки проектов: %s", exc, exc_info=True)
        return []


@router.post("/projects", status_code=201)
async def create_project(
    data: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Прямое создание проекта заказчиком (без ИИ)."""
    if not current_user.profile or current_user.profile.role.value != "employer":
        raise HTTPException(status_code=403, detail="Только заказчики могут создавать проекты")

    project = Project(
        employer_id=current_user.id,
        title=data.title,
        description=data.description,
        budget=data.budget,
        required_specialization=data.required_specialization,
        status=ProjectStatus.OPEN.value,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    logger.info("✅ Новый проект #%d '%s' создан заказчиком #%d", project.id, project.title, current_user.id)
    return {"status": "success", "project_id": project.id, "title": project.title}


@router.post("/projects/{project_id}/bids")
async def create_bid(
    project_id: int,
    bid_data: BidCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Отклик специалиста на проект."""
    if not current_user.profile or current_user.profile.role.value != "worker":
        raise HTTPException(status_code=403, detail="Только специалисты могут откликаться")

    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    if project.status != ProjectStatus.OPEN.value:
        raise HTTPException(status_code=400, detail="Проект уже не принимает отклики")

    existing = await db.execute(
        select(Bid).where(Bid.project_id == project_id, Bid.worker_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Вы уже откликались на этот заказ")

    bid = Bid(
        project_id=project_id,
        worker_id=current_user.id,
        cover_letter=bid_data.cover_letter,
        price_offer=bid_data.price_offer or project.budget,
        status=BidStatus.PENDING.value,
    )
    db.add(bid)
    await db.commit()
    await db.refresh(bid)

    logger.info("💼 Отклик #%d worker #%d → project #%d", bid.id, current_user.id, project_id)
    return {"status": "success", "message": "Отклик успешно отправлен", "bid_id": bid.id}


@router.post("/bids/{bid_id}/accept")
async def accept_bid(
    bid_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Заказчик выбирает исполнителя."""
    stmt = select(Bid).options(selectinload(Bid.project)).where(Bid.id == bid_id)
    res = await db.execute(stmt)
    bid = res.scalar_one_or_none()

    if not bid:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    if bid.project.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    if bid.status != BidStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Отклик уже обработан")

    bid.status = BidStatus.ACCEPTED.value
    bid.project.status = ProjectStatus.IN_PROGRESS.value

    # Отклоняем остальных претендентов
    others_res = await db.execute(
        select(Bid).where(Bid.project_id == bid.project_id, Bid.id != bid_id)
    )
    for other in others_res.scalars().all():
        other.status = BidStatus.REJECTED.value

    await db.commit()
    logger.info("✅ Отклик #%d принят | project #%d → in_progress", bid_id, bid.project_id)
    return {"status": "success", "message": "Исполнитель назначен. Сделка начата."}


@router.post("/projects/{project_id}/complete")
async def complete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Заказчик подтверждает завершение работы."""
    res = await db.execute(
        select(Project).where(Project.id == project_id, Project.employer_id == current_user.id)
    )
    project = res.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    if project.status != ProjectStatus.IN_PROGRESS.value:
        raise HTTPException(
            status_code=400,
            detail=f"Проект не в статусе in_progress (текущий: {project.status})"
        )

    project.status = ProjectStatus.COMPLETED.value
    await db.commit()
    logger.info("✅ Проект #%d завершён", project_id)
    return {"status": "success", "message": "Работа принята."}
