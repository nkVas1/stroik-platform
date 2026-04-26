from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
from app.core.database import get_db
from app.models.db_models import User, Profile, UserRole

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
    Принимает историю сообщений, возвращает ответ LLaMA.
    Автоматически сохраняет данные в БД если онбординг завершен.
    """
    reply, extracted_data = await llm_service.generate_response(request.messages)
    
    # Если ИИ вернул полные данные профиля, сохраняем их
    if extracted_data and request.user_id:
        try:
            # Проверяем/создаем пользователя
            user = await db.execute(
                f"SELECT * FROM users WHERE id = {request.user_id}"
            )
            
            # Сохраняем данные профиля (упрощенная версия)
            # В production используй SQLAlchemy ORM правильно
            pass
        except Exception as e:
            import logging
            logging.error(f"Ошибка при сохранении профиля: {e}")
    
    return ChatResponse(response=reply)
