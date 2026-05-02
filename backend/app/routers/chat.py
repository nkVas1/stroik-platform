"""
/api/chat endpoint.

Responsibility matrix:
  - Guest (no token):      create User+Profile from LLM role/entity_type data
  - Authed, no email:      update_profile fields; attach_email is handled by /api/auth/attach-email
  - Authed, has email:     update_profile, create_project, etc.

is_complete logic:
  True only when the user has: email attached + fio + location (verification_level >= BASIC)
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.chat import ChatRequest, ChatResponse
from app.models.db_models import (
    User, Profile, UserRole, EntityType, Project, VerificationLevel,
)
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

llm_service = LLMService()


# ------------------------------------------------------------------ helpers

def _is_onboarding_complete(user: User) -> bool:
    """Return True when the user has completed all mandatory onboarding phases."""
    if not user.email:
        return False
    p = user.profile
    if p is None:
        return False
    if p.role.value == "unknown":
        return False
    if p.verification_level < VerificationLevel.BASIC:   # IntEnum comparison
        return False
    return True


async def _resolve_user(authorization: Optional[str], db: AsyncSession) -> Optional[User]:
    """Decode Bearer token and load User+Profile, or return None for guests."""
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

    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == int(user_id))
    )
    return result.scalar_one_or_none()


# ------------------------------------------------------------------ endpoint

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    current_user = await _resolve_user(authorization, db)

    # ── LLM call ──────────────────────────────────────────────────────
    reply, extracted = await llm_service.generate_response(
        request.messages,
        current_user=current_user,
    )

    if not extracted:
        # Pure conversational reply, no DB action
        return ChatResponse(response=reply, is_complete=False)

    action     = extracted.get("action", "update_profile")
    data_patch = extracted.get("data", {})

    try:
        # ═══ GUEST: create initial account ═══════════════════════════
        if current_user is None:
            if "role" not in data_patch:
                return ChatResponse(response=reply, is_complete=False)

            new_user = User(is_verified=False)
            db.add(new_user)
            await db.flush()

            role_val   = data_patch.get("role", "unknown")
            entity_val = data_patch.get("entity_type", "unknown")

            role_enum = (
                UserRole.WORKER   if role_val == "worker"   else
                UserRole.EMPLOYER if role_val == "employer" else
                UserRole.UNKNOWN
            )
            entity_enum = (
                EntityType.PHYSICAL if entity_val == "physical" else
                EntityType.LEGAL    if entity_val == "legal"    else
                EntityType.UNKNOWN
            )

            new_profile = Profile(
                user_id=new_user.id,
                role=role_enum,
                entity_type=entity_enum,
                raw_data=data_patch,
            )
            db.add(new_profile)
            await db.commit()
            await db.refresh(new_user)

            token = create_access_token({"sub": str(new_user.id)})
            logger.info("🆕 Guest account created: User #%s role=%s", new_user.id, role_val)
            return ChatResponse(response=reply, is_complete=False, access_token=token)

        # ═══ AUTHENTICATED ════════════════════════════════════════════
        if action == "create_project":
            project = Project(
                employer_id=current_user.id,
                title=data_patch.get("title", "Новый заказ"),
                description=data_patch.get("description", ""),
                budget=data_patch.get("budget"),
                required_specialization=data_patch.get("required_specialization", ""),
            )
            db.add(project)
            await db.commit()
            logger.info("📋 Project created by User #%s: %s", current_user.id, project.title)
            return ChatResponse(
                response=reply,
                is_complete=_is_onboarding_complete(current_user),
            )

        elif action == "update_profile":
            profile = current_user.profile
            if profile is None:
                logger.warning("update_profile: User #%s has no profile", current_user.id)
                return ChatResponse(response=reply, is_complete=False)

            _PROFILE_FIELDS = {
                "fio", "location", "specialization", "experience_years",
                "company_name", "language_proficiency", "work_authorization",
                "project_scope",
            }
            for key, value in data_patch.items():
                if key in _PROFILE_FIELDS:
                    setattr(profile, key, value)

            # Auto-upgrade verification level when basic fields are filled
            if profile.fio and profile.location:
                if profile.verification_level < VerificationLevel.BASIC:
                    profile.verification_level = VerificationLevel.BASIC

            await db.commit()
            complete = _is_onboarding_complete(current_user)
            logger.info(
                "📝 Profile updated User #%s | complete=%s",
                current_user.id, complete,
            )
            return ChatResponse(response=reply, is_complete=complete)

        # Unknown action — log and return reply only
        logger.warning("Unknown LLM action '%s' for User #%s", action, current_user.id)
        return ChatResponse(response=reply, is_complete=False)

    except Exception as exc:
        await db.rollback()
        logger.error("❌ chat DB error for User #%s: %s", getattr(current_user, "id", "?"), exc, exc_info=True)
        return ChatResponse(
            response="Произошла техническая ошибка. Попробуйте ещё раз.",
            is_complete=False,
        )
