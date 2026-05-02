from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User, Project, Bid, Review, ProjectStatus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reviews", tags=["reviews"])


class ReviewCreateRequest(BaseModel):
    project_id: int
    rating: float = Field(..., ge=1.0, le=5.0)
    text: Optional[str] = Field(None, max_length=1000)


class ReviewResponse(BaseModel):
    id: int
    project_id: int
    project_title: str
    reviewer_name: str
    rating: float
    text: Optional[str]
    created_at: Optional[str]


@router.post("", status_code=201)
async def create_review(
    data: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Заказчик оставляет отзыв после завершения проекта.
    Требует: заказчик, проект в статусе completed, ещё не было отзыва.
    """
    # Проверяем роль
    if current_user.profile.role.value != "employer":
        raise HTTPException(status_code=403, detail="Отзывы оставляют заказчики")

    # Проверяем проект
    proj_res = await db.execute(
        select(Project).where(
            Project.id == data.project_id,
            Project.employer_id == current_user.id,
            Project.status == ProjectStatus.COMPLETED
        )
    )
    project = proj_res.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=404,
            detail="Проект не найден, не завершён или не ваш"
        )

    # Проверяем: отзыв ещё не оставлялся
    existing = await db.execute(
        select(Review).where(Review.project_id == data.project_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Отзыв для этого проекта уже есть")

    # Находим worker_id через accepted bid
    bid_res = await db.execute(
        select(Bid).where(
            Bid.project_id == data.project_id,
            Bid.status == "accepted"
        )
    )
    bid = bid_res.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=400, detail="Не найден принятый отклик")

    review = Review(
        project_id=data.project_id,
        reviewer_id=current_user.id,
        worker_id=bid.worker_id,
        rating=round(data.rating, 1),
        text=data.text,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    logger.info(f"⭐ Отзыв оставлен для worker #{bid.worker_id} | оценка {data.rating}")
    return {"status": "success", "review_id": review.id}


@router.get("/{worker_id}", response_model=List[ReviewResponse])
async def get_worker_reviews(
    worker_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Публичный список отзывов специалиста. Авторизация не требуется."""
    stmt = (
        select(Review)
        .options(
            selectinload(Review.project),
            selectinload(Review.reviewer).selectinload(User.profile),
        )
        .where(Review.worker_id == worker_id)
        .order_by(Review.created_at.desc())
    )
    res = await db.execute(stmt)
    reviews = res.scalars().all()

    return [
        ReviewResponse(
            id=r.id,
            project_id=r.project_id,
            project_title=r.project.title,
            reviewer_name=r.reviewer.profile.fio or r.reviewer.profile.company_name or f"Заказчик #{r.reviewer.id}",
            rating=r.rating,
            text=r.text,
            created_at=r.created_at.strftime("%d.%m.%Y") if r.created_at else None,
        )
        for r in reviews
    ]
