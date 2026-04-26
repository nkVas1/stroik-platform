import ollama
import logging
from app.models.chat import Message
from typing import List

logger = logging.getLogger(__name__)

class LLMService:
    """Сервис для взаимодействия с языковой моделью."""
    
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name
        # Системный промпт, задающий роль ассистенту "СТРОИК"
        self.system_prompt = {
            "role": "system",
            "content": (
                "Ты — профессиональный ИИ-ассистент платформы 'СТРОИК'. "
                "Твоя задача — помочь пользователю заполнить профиль, узнать его специализацию, "
                "опыт работы и цель (поиск работы или поиск рабочих). "
                "Задавай вопросы по одному. Будь вежлив, краток и профессионален. "
                "Пиши на русском языке."
            )
        }

    async def generate_response(self, messages: List[Message]) -> str:
        """
        Генерирует ответ модели на основе истории сообщений.

        Args:
            messages: Список объектов Message.

        Returns:
            Строка с ответом ассистента.
        """
        formatted_messages = [self.system_prompt]
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        try:
            # Вызов локального демона Ollama
            response = ollama.chat(model=self.model_name, messages=formatted_messages)
            return response['message']['content']
        except Exception as e:
            logger.error(f"Ошибка при обращении к Ollama: {e}")
            # Возвращаем fallback-ответ (Graceful degradation)
            return "Извините, сейчас я испытываю технические трудности. Пожалуйста, попробуйте позже."
