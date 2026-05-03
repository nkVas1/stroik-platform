import logging
from fastapi import APIRouter, Depends
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User
from app.models.portfolio import PortfolioCase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/verification", tags=["verification"])


@router.get("/status")
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/verification/status
    Возвращает текущий уровень верификации и баллы trusting-score.
    """
    profile = current_user.profile

    raw_level = profile.verification_level if profile else 0
    try:
        level = int(raw_level)
    except (TypeError, ValueError):
        level = 0

    fio = profile.fio if profile else None
    location = profile.location if profile else None
    has_portfolio = False
    verified_cases = 0

    # Count portfolio cases
    stmt = select(sa_func.count()).select_from(PortfolioCase).where(
        PortfolioCase.worker_id == current_user.id
    )
    count_result = await db.execute(stmt)
    total_cases: int = count_result.scalar_one_or_none() or 0
    has_portfolio = total_cases > 0

    stmt_v = select(sa_func.count()).select_from(PortfolioCase).where(
        PortfolioCase.worker_id == current_user.id,
        PortfolioCase.is_verified == True,  # noqa: E712
    )
    count_v = await db.execute(stmt_v)
    verified_cases = count_v.scalar_one_or_none() or 0

    # Calculate trust score (0-100)
    score = 0
    steps = {
        "fio_location": bool(fio and location),
        "portfolio": has_portfolio,
        "passport": level >= 3,
    }
    if steps["fio_location"]:   score += 33
    if steps["portfolio"]:       score += 34
    if steps["passport"]:        score += 33
    score = min(score, 100)

    return {
        "level": level,
        "score": score,
        "has_fio": bool(fio),
        "has_location": bool(location),
        "has_portfolio": has_portfolio,
        "total_cases": total_cases,
        "verified_cases": verified_cases,
        "has_passport": level >= 3,
        "steps": steps,
        "next_step": (
            None if score == 100
            else "fio_location" if not steps["fio_location"]
            else "portfolio" if not steps["portfolio"]
            else "passport"
        ),
    }
