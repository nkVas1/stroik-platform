"""
Chat router — AI onboarding orchestration.

State machine (handled by LLMService):
  Phase 0: role + entity_type  → creates guest User+Profile, issues JWT
  Phase 1: email + password    → attaches credentials to guest account
  Phase 2: fio + location      → updates profile, sets verification_level=BASIC
  Phase 3a (employer): project → creates Project record, is_complete=True
  Phase 3b (worker):   skills  → updates specialization, is_complete=True
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.chat import ChatRequest, ChatResponse
from app.models.db_models import (
    BidStatus, EntityType, Profile, Project, ProjectStatus, User, UserRole,
    VerificationLevel,
)
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

llm_service = LLMService()
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── helpers ─────────────────────────────────────────────────

async def _resolve_user(authorization: Optional[str], db: AsyncSession) -> Optional[User]:
    """Extract user from Bearer token; returns None if missing/invalid."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None

    result = await db.execute(select(User).where(User.id == int(user_id)))
    return result.scalar_one_or_none()


def _onboarding_complete(user: User) -> bool:
    """True when the user has finished all mandatory onboarding phases."""
    if not user or not user.profile:
        return False
    p = user.profile
    role = p.role
    if role == UserRole.UNKNOWN:
        return False
    if not user.email:          # Phase 1 not done
        return False
    if not p.fio or not p.location:  # Phase 2 not done
        return False
    return True


# ── endpoint ───────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    current_user = await _resolve_user(authorization, db)

    # Generate LLM reply + optional extracted action
    reply, extracted = await llm_service.generate_response(
        request.messages, current_user=current_user
    )

    if not extracted:
        return ChatResponse(response=reply, is_complete=False)

    action = extracted.get("action", "update_profile")
    data   = extracted.get("data", {})

    try:
        # ----------------------------------------------------------------
        # Phase 0 — guest arrives, role detected, create account
        # ----------------------------------------------------------------
        if action == "set_role" or (not current_user and "role" in data):
            role_val = data.get("role", "unknown")
            entity_val = data.get("entity_type", "unknown")

            new_user = User(is_verified=False)
            db.add(new_user)
            await db.flush()

            db_role = (
                UserRole.WORKER   if role_val == "worker"
                else UserRole.EMPLOYER if role_val == "employer"
                else UserRole.UNKNOWN
            )
            db_entity = (
                EntityType.PHYSICAL if entity_val == "physical"
                else EntityType.LEGAL if entity_val == "legal"
                else EntityType.UNKNOWN
            )
            profile = Profile(
                user_id=new_user.id,
                role=db_role,
                entity_type=db_entity,
                raw_data=data,
            )
            db.add(profile)
            await db.commit()
            await db.refresh(new_user)

            token = create_access_token({"sub": str(new_user.id)})
            logger.info("👤 Guest account created: User #%s role=%s", new_user.id, role_val)
            return ChatResponse(response=reply, is_complete=False, access_token=token)

        # All subsequent phases require an authenticated user
        if not current_user:
            return ChatResponse(response=reply, is_complete=False)

        # ----------------------------------------------------------------
        # Phase 1 — attach email + password
        # ----------------------------------------------------------------
        if action == "attach_email":
            email    = str(data.get("email", "")).strip().lower()
            password = str(data.get("password", ""))

            if "@" not in email:
                return ChatResponse(
                    response="Некорректный email — попробуйте ещё раз.",
                    is_complete=False,
                )
            if len(password) < 6:
                return ChatResponse(
                    response="Пароль должен быть не менее 6 символов.",
                    is_complete=False,
                )

            dup = await db.execute(select(User).where(User.email == email))
            if dup.scalar_one_or_none():
                return ChatResponse(
                    response="Этот email уже зарегистрирован. Укажите другой email.",
                    is_complete=False,
                )

            current_user.email         = email
            current_user.password_hash = _pwd.hash(password)
            await db.commit()

            new_token = create_access_token({"sub": str(current_user.id)})
            logger.info("🔗 Email attached: User #%s → %s", current_user.id, email)
            return ChatResponse(response=reply, is_complete=False, access_token=new_token)

        # ----------------------------------------------------------------
        # Phase 2 — update profile (fio, location, verification)
        # ----------------------------------------------------------------
        if action == "update_profile":
            profile = current_user.profile
            if profile:
                allowed = {
                    "fio", "location", "specialization", "experience_years",
                    "company_name", "language_proficiency", "work_authorization",
                    "project_scope",
                }
                for key, value in data.items():
                    if key in allowed:
                        setattr(profile, key, value)

                # auto-promote verification level
                if (
                    profile.fio
                    and profile.location
                    and profile.verification_level == VerificationLevel.NONE
                ):
                    profile.verification_level = VerificationLevel.BASIC

            await db.commit()

            is_done = _onboarding_complete(current_user)
            token   = create_access_token({"sub": str(current_user.id)}) if is_done else None
            return ChatResponse(response=reply, is_complete=is_done, access_token=token)

        # ----------------------------------------------------------------
        # Phase 3 (employer) — create project / TZ
        # ----------------------------------------------------------------
        if action == "create_project":
            project = Project(
                employer_id=current_user.id,
                title=data.get("title", "Новый заказ"),
                description=data.get("description", ""),
                budget=data.get("budget"),
                required_specialization=data.get("required_specialization", ""),
                status=ProjectStatus.OPEN,
            )
            db.add(project)
            await db.commit()
            logger.info("📋 Project created: #%s by User #%s", project.id, current_user.id)

            is_done = _onboarding_complete(current_user)
            token   = create_access_token({"sub": str(current_user.id)}) if is_done else None
            return ChatResponse(response=reply, is_complete=is_done, access_token=token)

    except Exception as exc:
        await db.rollback()
        logger.error("❌ Chat DB error (action=%s): %s", action, exc, exc_info=True)
        return ChatResponse(
            response="Произошла техническая ошибка. Повторите пожалуйста.",
            is_complete=False,
        )

    return ChatResponse(response=reply, is_complete=False)
