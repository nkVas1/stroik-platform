from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User, Project, Bid, BidStatus, ProjectStatus
from app.schemas.project import BidCreateRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["projects"])


@router.get("/projects")
async def get_projects(db: AsyncSession = Depends(get_db)):
    """Лента актуальных открытых заказов для работников."""
    try:
        stmt = select(Project).options(
            selectinload(Project.employer).selectinload(User.profile)
        ).where(Project.status == "open").order_by(Project.created_at.desc()).limit(20)

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
                "employer_name": p.employer.profile.company_name or p.employer.profile.fio or f"Заказчик #{p.employer.id}",
                "location": p.employer.profile.location or "Город не указан"
            }
            for p in projects
        ]
    except Exception as e:
        logger.error(f"❌ Ошибка при загрузке проектов: {str(e)}")
        return []


@router.post("/projects/{project_id}/bids")
async def create_bid(
    project_id: int,
    bid_data: BidCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Отклик специалиста на проект."""
    if current_user.profile.role.value != "worker":
        raise HTTPException(status_code=403, detail="Только специалисты могут откликаться на проекты")

    project_result = await db.execute(select(Project).where(Project.id == project_id))
    project = project_result.scalar_one_or_none()
    if not project or project.status != "open":
        raise HTTPException(status_code=404, detail="Проект не найден или уже закрыт")

    existing_bid = await db.execute(
        select(Bid).where(Bid.project_id == project_id, Bid.worker_id == current_user.id)
    )
    if existing_bid.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Вы уже откликнулись на этот заказ")

    new_bid = Bid(
        project_id=project_id,
        worker_id=current_user.id,
        cover_letter=bid_data.cover_letter,
        price_offer=bid_data.price_offer or project.budget
    )
    db.add(new_bid)
    await db.commit()

    return {"status": "success", "message": "Отклик успешно отправлен", "bid_id": new_bid.id}


@router.post("/bids/{bid_id}/accept")
async def accept_bid(
    bid_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Заказчик выбирает исполнителя. Сделка стартована."""
    stmt = select(Bid).options(selectinload(Bid.project)).where(Bid.id == bid_id)
    res = await db.execute(stmt)
    bid = res.scalar_one_or_none()

    if not bid:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    if bid.project.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    bid.status = BidStatus.ACCEPTED
    bid.project.status = ProjectStatus.IN_PROGRESS

    stmt_others = select(Bid).where(Bid.project_id == bid.project.id, Bid.id != bid_id)
    res_others = await db.execute(stmt_others)
    for other_bid in res_others.scalars().all():
        other_bid.status = BidStatus.REJECTED

    await db.commit()
    return {"status": "success", "message": "Исполнитель назначен. Сделка начата."}


@router.post("/projects/{project_id}/complete")
async def complete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Заказчик подтверждает завершение работы."""
    stmt = select(Project).where(Project.id == project_id)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()

    if not project or project.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только заказчик может завершить сделку")

    project.status = ProjectStatus.COMPLETED
    await db.commit()
    return {"status": "success", "message": "Работа принята. Средства выплачены подрядчику."}
