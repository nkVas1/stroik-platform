"""
/api/chat — основной эндпоинт онбординга.

Фаза 0 — создаёт User+Profile, выдаёт токен.
Фаза 1 — привязывает email+пароль к гость-аккаунту.
Фаза 2 — сохраняет ФИО+город, повышает verification_level.
Фаза 3 — создаёт проект (заказчик) или сохраняет спец. (рабочий), затем is_complete=True.
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status as http_status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import create_access_token, SECRET_KEY, ALGORITHM
from app.models.chat import ChatRequest, ChatResponse
from app.models.db_models import (
    Bid, EntityType, Profile, Project, User, UserRole, VerificationLevel,
)
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

llm_service = LLMService()
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def _get_optional_user(
    authorization: Optional[str],
    db: AsyncSession,
) -> Optional[User]:
    """Decode Bearer token, return User or None (never raises)."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None

    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == int(user_id))
    )
    return result.scalar_one_or_none()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:

    current_user = await _get_optional_user(authorization, db)

    # ── LLM call ───────────────────────────────────────────────────
    reply, extracted = await llm_service.generate_response(
        request.messages, current_user=current_user
    )

    if not extracted:
        return ChatResponse(response=reply)

    action      = extracted.get("action", "update_profile")
    data_patch  = extracted.get("data", {})

    try:
        return await _handle_action(
            action, data_patch, reply, current_user, db
        )
    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        logger.exception("Ошибка action=%s: %s", action, exc)
        return ChatResponse(
            response="Произошла техническая ошибка. Попробуйте ещё раз."
        )


# ─────────────────────────────────────────────────────────────────────
async def _handle_action(
    action: str,
    data: dict,
    reply: str,
    user: Optional[User],
    db: AsyncSession,
) -> ChatResponse:
    """Route extracted_data action to the correct handler, return ChatResponse."""

    # ──────────────────────────────────────────────────────────────────
    # Phase 0: create guest account from role+entity_type
    # ──────────────────────────────────────────────────────────────────
    if action == "set_role":
        if user is not None:
            # Already has an account — just update role if it changed
            profile = user.profile
            new_role = UserRole.WORKER if data.get("role") == "worker" else UserRole.EMPLOYER
            if profile.role != new_role:
                profile.role = new_role
                await db.commit()
            token = create_access_token({"sub": str(user.id)})
            return ChatResponse(response=reply, access_token=token)

        # Create fresh guest user
        new_user = User(is_verified=False)
        db.add(new_user)
        await db.flush()

        role_val = data.get("role", "unknown")
        entity_val = data.get("entity_type", "unknown")

        db_role = (
            UserRole.WORKER   if role_val   == "worker"   else
            UserRole.EMPLOYER if role_val   == "employer" else
            UserRole.UNKNOWN
        )
        db_entity = (
            EntityType.PHYSICAL if entity_val == "physical" else
            EntityType.LEGAL    if entity_val == "legal"    else
            EntityType.UNKNOWN
        )

        new_profile = Profile(
            user_id=new_user.id,
            role=db_role,
            entity_type=db_entity,
            raw_data=data,
        )
        db.add(new_profile)
        await db.commit()

        token = create_access_token({"sub": str(new_user.id)})
        logger.info("👤 Гость создан: User #%s role=%s", new_user.id, db_role)
        # is_complete=False: next phase is email attachment
        return ChatResponse(response=reply, access_token=token)

    # ──────────────────────────────────────────────────────────────────
    # Phase 1: attach email+password to guest account
    # ──────────────────────────────────────────────────────────────────
    if action == "attach_email":
        if user is None:
            return ChatResponse(
                response="Сначала нужно выбрать роль (запустите онбординг заново)."
            )

        email    = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or "@" not in email:
            return ChatResponse(
                response="Некорректный email. Укажите адрес в формате you@example.com."
            )
        if len(password) < 6:
            return ChatResponse(
                response="Пароль слишком короткий (минимум 6 символов)."
            )

        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            return ChatResponse(
                response="Этот email уже занят. Попробуйте другой адрес."
            )

        user.email         = email
        user.password_hash = _pwd.hash(password)
        await db.commit()

        new_token = create_access_token({"sub": str(user.id)})
        logger.info("🔗 email привязан: User #%s → %s", user.id, email)
        return ChatResponse(response=reply, access_token=new_token)

    # Require authenticated user for all remaining actions
    if user is None:
        return ChatResponse(
            response="Сессия устарела. Перезапустите онбординг."
        )

    # ──────────────────────────────────────────────────────────────────
    # Phase 2: update profile fio/location/verification_level
    # ──────────────────────────────────────────────────────────────────
    if action == "update_profile":
        profile = user.profile
        updatable = {
            "fio", "location", "specialization",
            "experience_years", "company_name", "project_scope",
        }
        for key, val in data.items():
            if key in updatable:
                setattr(profile, key, val)

        # Bump verification level if FIO+location are now set
        if profile.fio and profile.location:
            if (profile.verification_level is None or
                    profile.verification_level.value < VerificationLevel.BASIC.value):
                profile.verification_level = VerificationLevel.BASIC

        # explicit override from LLM
        if "verification_level" in data:
            try:
                profile.verification_level = VerificationLevel(int(data["verification_level"]))
            except (ValueError, KeyError):
                pass

        await db.commit()

        # After specialization is saved, onboarding is complete for workers
        is_done = bool(
            profile.specialization and
            profile.role == UserRole.WORKER
        )
        return ChatResponse(response=reply, is_complete=is_done)

    # ──────────────────────────────────────────────────────────────────
    # Phase 3a: create project (employer)
    # ──────────────────────────────────────────────────────────────────
    if action == "create_project":
        title = data.get("title") or "Новый заказ"
        if not title.strip():
            return ChatResponse(response="Укажите название заказа.")

        project = Project(
            employer_id=user.id,
            title=title,
            description=data.get("description", ""),
            budget=data.get("budget"),
            required_specialization=data.get("required_specialization", ""),
        )
        db.add(project)
        await db.commit()
        logger.info("📋 Проект создан: #%s '%s'", project.id, title)
        # Onboarding complete for employers once project is created
        return ChatResponse(response=reply, is_complete=True)

    # Fallback: unknown action — just return the reply
    logger.warning("Неизвестный action: %r", action)
    return ChatResponse(response=reply)
