"""
Chat router — drives the AI onboarding state machine.

Responsibilities:
  - Accept chat messages with optional Bearer token (guest or authenticated).
  - Call LLMService to get reply + extracted_data.
  - Execute extracted_data actions against the DB:
      set_role          → create User + Profile (guest → account)
      attach_email      → proxy signal only; actual logic in /api/auth/attach-email
                          (frontend calls that endpoint directly)
      update_profile    → patch Profile fields
      create_project    → create Project row
      complete_onboarding → set is_complete=True in response
  - Return ChatResponse(response, is_complete, access_token).
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.chat import ChatRequest, ChatResponse
from app.models.db_models import (
    EntityType, Profile, Project, User, UserRole, VerificationLevel
)
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

llm_service = LLMService()


async def _resolve_user(authorization: Optional[str], db: AsyncSession) -> Optional[User]:
    """Decode Bearer token and load User+Profile. Returns None for guests."""
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


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    current_user = await _resolve_user(authorization, db)

    # ------------------------------------------------------------------ #
    #  LLM call                                                            #
    # ------------------------------------------------------------------ #
    reply, extracted = await llm_service.generate_response(
        request.messages, current_user=current_user
    )

    if not extracted:
        return ChatResponse(response=reply, is_complete=False)

    action: str = extracted.get("action", "")
    data: dict = extracted.get("data", {})

    # ------------------------------------------------------------------ #
    #  Action dispatcher                                                   #
    # ------------------------------------------------------------------ #
    try:
        # -- Phase 0: create account with role --------------------------------
        if action == "set_role" and current_user is None:
            new_user = User(is_verified=False)
            db.add(new_user)
            await db.flush()

            role_val = data.get("role", "unknown")
            entity_val = data.get("entity_type", "unknown")

            db_role = (
                UserRole.WORKER if role_val == "worker"
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

            token = create_access_token({"sub": str(new_user.id)})
            logger.info("🎉 New user #%d created via chat (role=%s)", new_user.id, role_val)
            return ChatResponse(response=reply, is_complete=False, access_token=token)

        # -- Phase 1: attach_email is handled by /api/auth/attach-email -------
        # The LLM signals this action; the FRONTEND calls the auth endpoint directly.
        # Chat router just acknowledges so the conversation can continue.
        if action == "attach_email":
            # Frontend intercepts access_token refresh from /api/auth/attach-email.
            # Here we just pass through the reply so the chat continues.
            return ChatResponse(response=reply, is_complete=False)

        # Remaining actions require an authenticated user
        if current_user is None:
            logger.warning("⚠️ Action '%s' received but no current_user.", action)
            return ChatResponse(response=reply, is_complete=False)

        # -- update_profile ---------------------------------------------------
        if action == "update_profile":
            profile = current_user.profile
            if profile is None:
                profile = Profile(user_id=current_user.id)
                db.add(profile)

            _ALLOWED_PROFILE_FIELDS = {
                "fio", "location", "specialization", "experience_years",
                "company_name", "phone", "language_proficiency",
                "work_authorization", "project_scope",
            }
            for key, value in data.items():
                if key == "verification_level":
                    try:
                        profile.verification_level = VerificationLevel(int(value))
                    except (ValueError, KeyError):
                        pass
                elif key in _ALLOWED_PROFILE_FIELDS:
                    setattr(profile, key, value)

            await db.commit()
            return ChatResponse(response=reply, is_complete=False)

        # -- create_project ---------------------------------------------------
        if action == "create_project":
            project = Project(
                employer_id=current_user.id,
                title=data.get("title", "Новый заказ"),
                description=data.get("description", ""),
                budget=data.get("budget"),
                required_specialization=data.get("required_specialization"),
            )
            db.add(project)
            await db.commit()
            logger.info("💼 Project '%s' created for employer #%d", project.title, current_user.id)
            return ChatResponse(response=reply, is_complete=False)

        # -- complete_onboarding ----------------------------------------------
        if action == "complete_onboarding":
            logger.info("✅ Onboarding complete for user #%s",
                        current_user.id if current_user else "guest")
            return ChatResponse(
                response=reply,
                is_complete=True,
                access_token=create_access_token({"sub": str(current_user.id)})
                if current_user else None,
            )

    except Exception as exc:
        await db.rollback()
        logger.error("❌ DB error during action '%s': %s", action, exc, exc_info=True)
        return ChatResponse(
            response="Данные приняты, но произошла ошибка сохранения.",
            is_complete=False,
        )

    return ChatResponse(response=reply, is_complete=False)
