from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService

# Инициализация приложения
app = FastAPI(
    title="Stroik API",
    description="API для строительной платформы СТРОИК",
    version="0.1.0"
)

# Настройка CORS (Разрешаем запросы с локального фронтенда)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
async def chat_endpoint(request: ChatRequest):
    """
    Основной эндпоинт для общения с ИИ-ассистентом.
    Принимает историю сообщений, возвращает ответ LLaMA.
    """
    reply = await llm_service.generate_response(request.messages)
    return ChatResponse(response=reply)
