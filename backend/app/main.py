from fastapi import FastAPI, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func
from typing import Optional
from jose import jwt, JWTError
import logging

from app.models.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, SECRET_KEY, ALGORITHM
from app.models.db_models import User, Profile, UserRole, EntityType, VerificationLevel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация приложения
app = FastAPI(
    title="Stroik API",
    description="API для строительной платформы СТРОИК",
    version="0.1.0"
)

# Настройка CORS (Разрешаем запросы с локального фронтенда)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация сервисов
llm_service = LLMService(model_name="llama3")

@app.get("/health")
async def health_check():
    """Эндпоинт для проверки статуса сервера (Health check)."""
    return {"status": "ok", "service": "Stroik Core API"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest, 
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Основной эндпоинт для общения с ИИ-ассистентом.
    Поддерживает гибридный режим: онбординг новых пользователей и верификацию/редактирование существующих.
    """
    # Пытаемся расшифровать пользователя, если токен передан
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
        except (JWTError, ValueError):
            pass  # Если токен невалидный, продолжаем как гость
    
    # Получаем ответ от ИИ
    # ВАЖНО: Передаем current_user чтобы ИИ знал, какую инструкцию выбрать (State Machine)
    reply, extracted_data = await llm_service.generate_response(request.messages, current_user=current_user)

    # Обрабатываем данные, если ИИ вернул структурированные данные
    if extracted_data and extracted_data.get("status") == "update":
        data_patch = extracted_data.get("data", {})
        
        try:
            if current_user and current_user.profile:
                # РЕЖИМ ВЕРИФИКАЦИИ: Обновление существующего пользователя (Фаза 1 и 2)
                logger.info(f"🔄 Обновляем профиль User ID {current_user.id}")
                
                for key, value in data_patch.items():
                    if hasattr(current_user.profile, key):
                        setattr(current_user.profile, key, value)
                        logger.info(f"   → {key}: {value}")
                
                await db.commit()
                # Продолжаем диалог
                return ChatResponse(response=reply, is_complete=False)
            
            else:
                # РЕЖИМ ОНБОРДИНГА: Создание нового пользователя (Фаза 0 завершена)
                if "role" in data_patch and "entity_type" in data_patch:
                    logger.info(f"✨ Завершение базового онбординга")
                    
                    new_user = User(is_verified=False)
                    db.add(new_user)
                    await db.flush()  # Получаем ID

                    # Строгий маппинг в Enum для защиты БД от мусорных данных
                    role_str = data_patch.get("role", "").lower()
                    entity_str = data_patch.get("entity_type", "").lower()
                    
                    db_role = UserRole.WORKER if role_str == "worker" else (
                        UserRole.EMPLOYER if role_str == "employer" else UserRole.UNKNOWN
                    )
                    
                    db_entity = EntityType.PHYSICAL if entity_str == "physical" else (
                        EntityType.LEGAL if entity_str == "legal" else EntityType.UNKNOWN
                    )

                    new_profile = Profile(
                        user_id=new_user.id,
                        role=db_role,
                        entity_type=db_entity,
                        raw_data=data_patch
                    )
                    db.add(new_profile)
                    await db.commit()
                    
                    logger.info(f"✅ Создан профиль для User ID {new_user.id}, роль: {db_role.value}, тип: {db_entity.value}")

                    # Генерируем токен и даем команду фронтенду на редирект
                    token = create_access_token(data={"sub": str(new_user.id)})
                    return ChatResponse(response=reply, is_complete=True, access_token=token)
                else:
                    # Неполные данные онбординга, продолжаем диалог
                    return ChatResponse(response=reply, is_complete=False)
                    
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Ошибка при обработке данных: {e}")
            # Возвращаем fallback-ответ, чтобы не вызывать ошибку 422
            return ChatResponse(
                response="Данные приняты, но произошла ошибка базы данных. Попробуйте еще раз.",
                is_complete=False
            )

    # Обычный текстовый ответ, если диалог еще идет
    return ChatResponse(response=reply, is_complete=False)


@app.get("/api/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Возвращает данные текущего авторизованного пользователя.
    Требует валидный JWT токен в заголовке Authorization: Bearer <token>
    """
    profile = current_user.profile
    
    return {
        "id": current_user.id,
        "is_verified": current_user.is_verified,
        "role": profile.role.value if profile else "unknown",
        "entity_type": profile.entity_type.value if profile else "unknown",
        "company_name": profile.company_name if profile else None,
        "verification_level": profile.verification_level.value if profile else 0,
        "fio": profile.fio if profile else None,
        "location": profile.location if profile else None,
        "email": profile.email if profile else None,
        "language_proficiency": profile.language_proficiency if profile else None,
        "work_authorization": profile.work_authorization if profile else None,
        "specialization": profile.specialization if profile else None,
        "experience_years": profile.experience_years if profile else None,
        "project_scope": profile.project_scope if profile else None,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }
