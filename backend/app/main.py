from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.models.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
from app.core.database import get_db
from app.models.db_models import User, Profile, UserRole

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
async def chat_endpoint(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Основной эндпоинт для общения с ИИ-ассистентом.
    Принимает историю сообщений, возвращает ответ LLaMA и сохраняет профиль в БД если онбординг завершен.
    """
    # Распаковываем кортеж из LLMService
    reply, extracted_data = await llm_service.generate_response(request.messages)

    # Если ИИ вернул структурированные данные (статус complete), сохраняем в PostgreSQL
    if extracted_data and extracted_data.get("status") == "complete":
        try:
            # 1. Создаем базового пользователя (В будущем здесь будет привязка по сессии/номеру телефона)
            new_user = User(is_verified=False)
            db.add(new_user)
            await db.flush() # flush отправляет запрос в БД, но не коммитит транзакцию, позволяя получить ID
            
            # 2. Определяем роль
            role_str = extracted_data.get("role", "").lower()
            if role_str == "worker":
                db_role = UserRole.WORKER
            elif role_str == "employer":
                db_role = UserRole.EMPLOYER
            else:
                db_role = UserRole.UNKNOWN

            # 3. Создаем профиль
            new_profile = Profile(
                user_id=new_user.id,
                role=db_role,
                specialization=extracted_data.get("specialization", ""),
                experience_years=extracted_data.get("experience_years", 0),
                raw_data=extracted_data
            )
            db.add(new_profile)
            
            # 4. Фиксируем изменения
            await db.commit()
            logger.info(f"✅ Успешно создан профиль для User ID {new_user.id} со специализацией {new_profile.specialization}")

            # Возвращаем ответ с флагом завершения
            return ChatResponse(response=reply, is_complete=True)

        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Ошибка при сохранении профиля в БД: {e}")
            # Возвращаем fallback ответ, чтобы не ломать UX
            return ChatResponse(response="Данные собраны, но произошла ошибка при сохранении. Пожалуйста, обратитесь в поддержку.", is_complete=False)

    # Обычный ответ, если диалог еще идет
    return ChatResponse(response=reply, is_complete=False)
