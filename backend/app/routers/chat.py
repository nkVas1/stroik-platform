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

llm_service = LLMService()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    # 1. Опциональная авторизация
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
        except Exception as e:
            logger.warning(f"⚠️ Ошибка токена в чате: {e}")

    # 2. Вызов LLM
    reply, extracted_data = await llm_service.generate_response(request.messages, current_user=current_user)

    # 3. Обработка результатов
    if extracted_data:
        action = extracted_data.get("action", "update_profile")
        data_patch = extracted_data.get("data", {})

        try:
            if current_user:
                # Действия для авторизованных пользователей
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

                elif action == "attach_email":
                    # Привязать email+пароль к существующему guest-аккаунту
                    from passlib.context import CryptContext
                    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

                    email = data_patch.get("email", "").strip().lower()
                    password = data_patch.get("password", "")

                    if not email or "@" not in email:
                        return ChatResponse(response="Некорректный email, попробуйте ещё раз.", is_complete=False)
                    if len(password) < 6:
                        return ChatResponse(response="Пароль слишком короткий (минимум 6 символов).", is_complete=False)

                    # Проверяем уникальность email
                    existing = await db.execute(select(User).where(User.email == email))
                    if existing.scalar_one_or_none():
                        return ChatResponse(
                            response="Этот email уже занят. Попробуйте другой.",
                            is_complete=False
                        )

                    current_user.email = email
                    current_user.password_hash = pwd_context.hash(password)
                    await db.commit()

                    # Выдаём новый токен (email теперь часть аккаунта)
                    new_token = create_access_token({"sub": str(current_user.id)})
                    logger.info(f"🔗 Email привязан в чате: User #{current_user.id} → {email}")
                    return ChatResponse(
                        response=reply,
                        is_complete=False,
                        access_token=new_token  # фронт обновит токен
                    )

                else:
                    # update_profile
                    for key, value in data_patch.items():
                        if hasattr(current_user.profile, key):
                            setattr(current_user.profile, key, value)
                    await db.commit()
                    return ChatResponse(response=reply, is_complete=False)

            else:
                # Гость: базовый онбординг (создание аккаунта)
                if "role" in data_patch:
                    new_user = User(is_verified=False)
                    db.add(new_user)
                    await db.flush()

                    db_role = UserRole.WORKER if data_patch.get("role") == "worker" else UserRole.EMPLOYER
                    entity_val = data_patch.get("entity_type")
                    db_entity = (
                        EntityType.PHYSICAL if entity_val == "physical"
                        else EntityType.LEGAL if entity_val == "legal"
                        else EntityType.UNKNOWN
                    )

                    new_profile = Profile(
                        user_id=new_user.id,
                        role=db_role,
                        entity_type=db_entity,
                        raw_data=data_patch
                    )
                    db.add(new_profile)
                    await db.commit()

                    token = create_access_token(data={"sub": str(new_user.id)})
                    # is_complete=False: онбординг продолжается (следующая фаза — email/пароль)
                    return ChatResponse(response=reply, is_complete=False, access_token=token)

        except Exception as e:
            await db.rollback()
            logger.error(f"Ошибка сохранения в БД: {e}")
            return ChatResponse(response="Данные приняты, но произошла техническая ошибка.", is_complete=False)

    return ChatResponse(response=reply, is_complete=False)
