import ollama
import logging
import json
from app.models.chat import Message
from typing import List, Tuple, Optional, Dict, Any

logger = logging.getLogger(__name__)

class LLMService:
    """Сервис взаимодействия с ИИ с поддержкой структурированного извлечения данных."""
    
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name
        self.system_prompt = {
            "role": "system",
            "content": (
                "Ты — профессиональный ИИ-ассистент платформы 'СТРОИК'. "
                "Твоя цель: узнать у пользователя 3 вещи: "
                "1. Роль (он ищет работу 'worker' или ищет рабочих 'employer')? "
                "2. Специализация (например, плиточник, ремонт квартир под ключ). "
                "3. Опыт работы в годах. "
                "Задавай вопросы по одному. Будь краток и вежлив. Пиши на русском. "
                "ВАЖНОЕ ПРАВИЛО: Если ты узнал ВСЕ три параметра, ты должен ответить СТРОГО в формате JSON, "
                "без какого-либо дополнительного текста. Формат: "
                "{\"status\": \"complete\", \"role\": \"worker/employer\", \"specialization\": \"...\", \"experience_years\": 5}"
            )
        }

    async def generate_response(self, messages: List[Message]) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Возвращает кортеж: (текст_для_пользователя, извлеченные_данные_json_если_есть).
        """
        formatted_messages = [self.system_prompt]
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        try:
            response = ollama.chat(model=self.model_name, messages=formatted_messages)
            content = response['message']['content'].strip()
            
            # Проверяем, вернула ли модель JSON (завершение онбординга)
            if content.startswith('{') and content.endswith('}'):
                try:
                    extracted_data = json.loads(content)
                    if extracted_data.get("status") == "complete":
                        return ("Отлично! Ваш профиль успешно заполнен. Мы сохранили данные.", extracted_data)
                except json.JSONDecodeError:
                    pass  # Если это не валидный JSON, продолжаем как обычный текст
                    
            return (content, None)
            
        except Exception as e:
            logger.error(f"Ошибка Ollama: {e}")
            return ("Извините, сейчас я испытываю технические трудности.", None)
