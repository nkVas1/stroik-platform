import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

VALID_PLANS = {"free", "start", "pro", "team", "enterprise"}


class UpgradeRequest(BaseModel):
    plan: str


@router.post("/upgrade")
async def upgrade_subscription(
    body: UpgradeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/subscriptions/upgrade
    Сохраняет выбранный тариф в profile.raw_data['plan'].
    MVP: платёж не интегрирован, тариф применяется немедленно.
    """
    plan = body.plan.lower().strip()
    if plan not in VALID_PLANS:
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый тариф: {plan}. Доступные: {', '.join(VALID_PLANS)}"
        )

    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=400, detail="Профиль не найден")

    raw = profile.raw_data or {}
    old_plan = raw.get("plan", "free")
    raw["plan"] = plan
    profile.raw_data = raw

    # Flag the instance as modified (needed for JSON columns in SQLAlchemy)
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(profile, "raw_data")

    await db.commit()
    logger.info("💳 User %d upgraded: %s -> %s", current_user.id, old_plan, plan)
    return {"status": "success", "plan": plan, "previous_plan": old_plan}


@router.get("/current")
async def get_current_plan(
    current_user: User = Depends(get_current_user),
):
    """GET /api/subscriptions/current"""
    profile = current_user.profile
    raw = profile.raw_data or {} if profile else {}
    plan = raw.get("plan", "free").lower() if isinstance(raw, dict) else "free"
    return {"plan": plan}
