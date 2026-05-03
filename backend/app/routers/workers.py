import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sa_func
from sqlalchemy.orm import selectinload
from typing import Optional

from app.core.database import get_db
from app.models.db_models import User, Profile, Bid, Project, BidStatus, ProjectStatus, Review
from app.models.portfolio import PortfolioCase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/workers", tags=["workers"])


@router.get("")
async def list_workers(
    specialization: Optional[str] = Query(None, description="Фильтр по специализации"),
    city: Optional[str] = Query(None, description="Фильтр по городу"),
    min_level: int = Query(0, ge=0, le=3, description="Минимальный уровень верификации"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/workers
    Публичный каталог исполнителей с фильтрами и пагинацией.
    """
    stmt = (
        select(User)
        .join(User.profile)
        .options(
            selectinload(User.profile),
        )
        .where(Profile.role == "worker")
        .where(Profile.verification_level >= min_level)
    )

    if specialization:
        stmt = stmt.where(
            Profile.specialization.ilike(f"%{specialization}%")
        )
    if city:
        stmt = stmt.where(
            Profile.location.ilike(f"%{city}%")
        )

    # Count total for pagination meta
    count_stmt = select(sa_func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total: int = total_res.scalar_one_or_none() or 0

    stmt = stmt.order_by(Profile.verification_level.desc(), User.id.asc())
    stmt = stmt.limit(limit).offset(offset)

    res = await db.execute(stmt)
    users = res.scalars().all()

    result = []
    for user in users:
        profile = user.profile

        # avg rating
        rating_stmt = select(sa_func.avg(Review.rating)).where(Review.worker_id == user.id)
        rating_res = await db.execute(rating_stmt)
        avg_rating = rating_res.scalar_one_or_none()

        # reviews count
        reviews_count_stmt = select(sa_func.count(Review.id)).where(Review.worker_id == user.id)
        reviews_count_res = await db.execute(reviews_count_stmt)
        reviews_count: int = reviews_count_res.scalar_one_or_none() or 0

        # completed projects
        completed_stmt = (
            select(sa_func.count(Bid.id))
            .join(Project, Bid.project_id == Project.id)
            .where(
                Bid.worker_id == user.id,
                Bid.status == BidStatus.ACCEPTED.value,
                Project.status == ProjectStatus.COMPLETED.value,
            )
        )
        completed_res = await db.execute(completed_stmt)
        completed_count: int = completed_res.scalar_one_or_none() or 0

        # portfolio count
        portfolio_count_stmt = select(sa_func.count(PortfolioCase.id)).where(
            PortfolioCase.worker_id == user.id
        )
        portfolio_count_res = await db.execute(portfolio_count_stmt)
        portfolio_count: int = portfolio_count_res.scalar_one_or_none() or 0

        # first portfolio photo
        photo_stmt = (
            select(PortfolioCase.photo_urls)
            .where(PortfolioCase.worker_id == user.id)
            .order_by(PortfolioCase.created_at.desc())
            .limit(1)
        )
        photo_res = await db.execute(photo_stmt)
        photo_row = photo_res.scalar_one_or_none()
        first_photo = (photo_row[0] if photo_row and len(photo_row) > 0 else None)

        try:
            v_level = int(profile.verification_level) if profile.verification_level is not None else 0
        except (TypeError, ValueError):
            v_level = 0

        raw = profile.raw_data or {}
        bio = raw.get("bio") if isinstance(raw, dict) else None

        result.append({
            "id": user.id,
            "fio": profile.fio or f"Специалист #{user.id}",
            "specialization": profile.specialization,
            "location": profile.location,
            "entity_type": profile.entity_type.value if profile.entity_type else "unknown",
            "experience_years": profile.experience_years,
            "verification_level": v_level,
            "avg_rating": round(float(avg_rating), 1) if avg_rating else None,
            "reviews_count": reviews_count,
            "completed_count": completed_count,
            "portfolio_count": portfolio_count,
            "first_photo": first_photo,
            "bio": bio,
            "member_since": user.created_at.strftime("%B %Y") if user.created_at else None,
        })

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "workers": result,
    }
