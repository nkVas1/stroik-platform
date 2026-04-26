import ollama
import logging
import json
import re
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
                "Ты — вежливый ИИ-ассистент строительной платформы 'СТРОИК'. Твоя цель — собрать данные профиля.\n"
                "Действуй по шагам:\n"
                "Шаг 1: Узнай, ищет ли пользователь работу (рабочий) или хочет нанять специалистов (заказчик).\n"
                "Шаг 2: В зависимости от ответа:\n"
                "  - Если он рабочий (worker): узнай его специальность и опыт работы (в годах).\n"
                "  - Если он заказчик (employer): узнай, какие именно специалисты ему нужны и для какого объекта (квартира, дом, офис).\n"
                "Правила:\n"
                "1. Задавай только один вопрос за раз.\n"
                "2. Веди диалог естественно и на русском языке.\n"
                "3. ВАЖНО: Как только ты соберешь все необходимые данные для роли, не пиши текст! Верни СТРОГО один валидный JSON:\n"
                "Для рабочего: {\"status\": \"complete\", \"role\": \"worker\", \"specialization\": \"плиточник\", \"experience_years\": 5}\n"
                "Для заказчика: {\"status\": \"complete\", \"role\": \"employer\", \"specialization\": \"монтажники\", \"project_scope\": \"ремонт офиса\"}"
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
            # Ищем JSON в любом месте контента, не только в начале/конце
            try:
                # Ищем JSON объект в содержимом
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content)
                if json_match:
                    json_str = json_match.group(0)
                    extracted_data = json.loads(json_str)
                    if extracted_data.get("status") == "complete":
                        return ("Отлично! Ваш профиль успешно заполнен. Мы сохранили данные.", extracted_data)
            except (json.JSONDecodeError, AttributeError):
                pass  # Если это не валидный JSON, продолжаем как обычный текст
                    
            return (content, None)
            
        except Exception as e:
            logger.error(f"Ошибка Ollama: {e}")
            return ("Извините, сейчас я испытываю технические трудности.", None)
