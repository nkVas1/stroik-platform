from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from jose import jwt
import logging

from app.models.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
from app.core.database import get_db
from app.core.security import create_access_token, SECRET_KEY, ALGORITHM
from app.models.db_models import User, Profile, UserRole, EntityType, Project

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

# Инициализируем LLM-сервис один раз на весь роутер
llm_service = LLMService()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Главный чат-эндпоинт. Обрабатывает онбординг и последующие AI-действия по профилю."""
    # 1. Опциональная авторизация (гость или авторизованный пользователь)
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                result = await db.execute(
                    select(User).options(selectinload(User.profile)).where(User.id == int(user_id))
                )
                current_user = result.scalar_one_or_none()
                logger.info(f"✅ Чат: Авторизован User ID {current_user.id}, Роль: {current_user.profile.role.value}")
        except Exception as e:
            logger.warning(f"⚠️ Ошибка токена в чате: {e}")

    if not current_user:
        logger.info("🕵️ Чат: Гостевая сессия (Новый пользователь)")

    # 2. Вызов LLM
    reply, extracted_data = await llm_service.generate_response(request.messages, current_user=current_user)

    # 3. Обработка результатов LLM
    if extracted_data:
        action = extracted_data.get("action", "update_profile")
        data_patch = extracted_data.get("data", {})

        try:
            if current_user:
                if action == "create_project":
                    new_project = Project(
                        employer_id=current_user.id,
                        title=data_patch.get("title", "Новый заказ"),
                        description=data_patch.get("description", ""),
                        budget=data_patch.get("budget", 0),
                        required_specialization=data_patch.get("required_specialization", "")
                    )
                    db.add(new_project)
                    await db.commit()
                    return ChatResponse(response=reply, is_complete=False)
                else:
                    # update_profile: обновляем поля профиля
                    for key, value in data_patch.items():
                        if hasattr(current_user.profile, key):
                            setattr(current_user.profile, key, value)
                    await db.commit()
                    return ChatResponse(response=reply, is_complete=False)
            else:
                # Базовый онбординг: создание нового пользователя
                if "role" in data_patch:
                    logger.info("✨ Завершение базового онбординга")
                    new_user = User(is_verified=False)
                    db.add(new_user)
                    await db.flush()

                    db_role = UserRole.WORKER if data_patch.get("role") == "worker" else UserRole.EMPLOYER

                    entity_val = data_patch.get("entity_type")
                    if entity_val == "physical":
                        db_entity = EntityType.PHYSICAL
                    elif entity_val == "legal":
                        db_entity = EntityType.LEGAL
                    else:
                        db_entity = EntityType.UNKNOWN

                    new_profile = Profile(
                        user_id=new_user.id,
                        role=db_role,
                        entity_type=db_entity,
                        raw_data=data_patch
                    )
                    db.add(new_profile)
                    await db.commit()

                    token = create_access_token(data={"sub": str(new_user.id)})
                    return ChatResponse(response=reply, is_complete=True, access_token=token)

        except Exception as e:
            await db.rollback()
            logger.error(f"Ошибка сохранения в БД: {e}")
            return ChatResponse(response="Данные приняты, но произошла техническая ошибка.", is_complete=False)

    return ChatResponse(response=reply, is_complete=False)
