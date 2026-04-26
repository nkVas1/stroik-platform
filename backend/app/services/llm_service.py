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
                "Ты — гениальный ИИ-ассистент платформы 'СТРОИК'. Твоя задача: онбординг, верификация и гибкое обновление профиля пользователя.\n"
                "Определи текущую цель пользователя из контекста беседы и действуй соответственно.\n\n"
                
                "ФАЗА 0: БАЗОВЫЙ ОНБОРДИНГ (Если профиля еще нет или роль не определена)\n"
                "Узнай: 1. Роль (ищет работу = worker, или ищет рабочих = employer). 2. Тип лица (физическое лицо, компания/юридическое лицо).\n"
                "Если это компания - узнай название. Для рабочих можешь спросить специальность и опыт. Заказчикам пока объект не требуется.\n\n"
                
                "ФАЗА 1: ВЕРИФИКАЦИЯ (Если пользователь хочет повысить уровень доверия или ты это предложишь)\n"
                "Уровень 1 (BASIC): Узнай Фамилия Имя Отчество и город проживания.\n"
                "Уровень 2 (CONTACTS): Узнай Email и проверь телефон.\n"
                "Уровень 3 (PASSPORT): Подготовка к загрузке документов (скан паспорта/ИНН).\n"
                "Двигайся постепенно, предлагай повысить уровень мягко.\n\n"
                
                "ФАЗА 2: СВОБОДНОЕ РЕДАКТИРОВАНИЕ & ЛЕГАЛЬНЫЕ ФИЛЬТРЫ\n"
                "Если пользователь просит добавить навыки, описать объект (заказчик) или требования к качеству коммуникации:\n"
                "- Если услышал 'нужны русские' / 'русскоговорящие' / 'говорящие по-русски' → переведи в language_proficiency='Свободное владение русским языком'\n"
                "- Если услышал 'с визой' / 'граждане РФ' / 'патент' → переведи в work_authorization соответственно\n"
                "- Этот подход легален, этичен и полностью закрывает потребность в качественной коммуникации на объекте.\n\n"
                
                "ПРАВИЛА ВОЗВРАТА ДАННЫХ:\n"
                "Для КАЖДОГО логического блока данных (завершение фазы, получение новых данных) верни ответ в формате:\n"
                "```json\n"
                "{\"status\": \"update\", \"response\": \"Ваш ответ пользователю текстом...\", \"data\": {\"field_name\": value}}\n"
                "```\n"
                "Примеры data:\n"
                "- Базовый онбординг (worker): {\"role\": \"worker\", \"entity_type\": \"physical\", \"specialization\": \"плиточник\", \"experience_years\": 10}\n"
                "- Базовый онбординг (employer): {\"role\": \"employer\", \"entity_type\": \"legal\", \"company_name\": \"ООО Ремонт\"}\n"
                "- Верификация Уровень 1: {\"fio\": \"Иванов Иван Иванович\", \"location\": \"Москва\", \"verification_level\": 1}\n"
                "- Легальные фильтры: {\"language_proficiency\": \"Свободное владение русским языком\", \"work_authorization\": \"Гражданство РФ\"}\n"
                "ВСЕГДА возвращай status='update', ключ response для текста в чат, и поле data с собранными/обновленными ключами."
            )
        }

    async def generate_response(self, messages: List[Message]) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Возвращает кортеж: (текст_для_пользователя, извлеченные_данные_json_если_есть).
        Поддерживает статусы 'update' (обновление профиля без завершения) и 'complete' (завершение онбординга).
        """
        formatted_messages = [self.system_prompt]
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        try:
            response = ollama.chat(model=self.model_name, messages=formatted_messages)
            content = response['message']['content'].strip()
            
            # Пытаемся найти JSON в ответе
            try:
                # Ищем JSON объект в содержимом (может быть завернут в текст)
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content)
                if json_match:
                    json_str = json_match.group(0)
                    extracted_data = json.loads(json_str)
                    
                    # Поддерживаем оба статуса
                    if extracted_data.get("status") in ["update", "complete"]:
                        # Возвращаем текст из поля "response" если оно есть, иначе исходный контент
                        response_text = extracted_data.get("response", content)
                        return (response_text, extracted_data)
            except (json.JSONDecodeError, AttributeError):
                pass  # Если это не валидный JSON, продолжаем как обычный текст
                    
            return (content, None)
            
        except Exception as e:
            logger.error(f"Ошибка Ollama: {e}")
            return ("Извините, сейчас я испытываю технические трудности.", None)
