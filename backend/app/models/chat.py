from pydantic import BaseModel, Field
from typing import List, Optional

class Message(BaseModel):
    """Схема отдельного сообщения в чате."""
    role: str = Field(..., description="Роль отправителя: 'user', 'assistant' или 'system'")
    content: str = Field(..., min_length=1, description="Текст сообщения")

class ChatRequest(BaseModel):
    """Схема входящего запроса для эндпоинта чата."""
    user_id: Optional[str] = Field(None, description="Идентификатор пользователя (для сессии)")
    messages: List[Message] = Field(..., description="История переписки для контекста")

class ChatResponse(BaseModel):
    """Схема ответа от ИИ-ассистента."""
    response: str = Field(..., description="Сгенерированный текст ответа")
    tokens_used: Optional[int] = Field(None, description="Количество потраченных токенов (для аналитики)")
