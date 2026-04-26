import ollama
import logging
import json
import re
from app.models.chat import Message
from typing import List, Tuple, Optional, Dict, Any

logger = logging.getLogger(__name__)

class LLMService:
    """
    Сервис взаимодействия с ИИ с поддержкой State Machine паттерна.
    Промпт генерируется динамически в зависимости от состояния пользователя.
    """
    
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name

    def _get_prompt_for_state(self, current_user=None) -> Dict[str, str]:
        """
        Динамически генерирует системный промпт в зависимости от состояния пользователя.
        Это минимизирует контекст и сфокусирует модель на одной задаче.
        
        Args:
            current_user: User объект из БД или None если гость
            
        Returns:
            Dict с role и content для системного промпта
        """
        
        base_rules = (
            "КРИТИЧЕСКИЕ ПРАВИЛА:\n"
            "1. ОТВЕЧАЙ СТРОГО НА РУССКОМ ЯЗЫКЕ. Никаких других языков.\n"
            "2. Задавай ровно ОДИН короткий вопрос за раз.\n"
            "3. Если пользователь пишет бред (\"я рыба\", \"как дела\"), вежливо верни его к теме.\n"
            "4. Ответ должен быть понятен обычному человеку, без жаргона.\n"
        )

        # СОСТОЯНИЕ 0: НОВЫЙ ПОЛЬЗОВАТЕЛЬ (нет профиля)
        if not current_user or not current_user.profile or current_user.profile.role == "unknown":
            return {
                "role": "system",
                "content": (
                    "Ты — стартовый ИИ-ассистент платформы 'СТРОИК'.\n"
                    "Твоя ЕДИНСТВЕННАЯ задача: зарегистрировать нового пользователя.\n\n"
                    "Узнай ровно 2 вещи (по одному вопросу):\n"
                    "1️⃣ Роль: ищет он работу (worker) ИЛИ ищет рабочих/специалистов (employer).\n"
                    "2️⃣ Тип лица: физическое лицо (physical) ИЛИ компания/организация (legal).\n\n"
                    f"{base_rules}"
                    "Когда ты узнал оба ответа, запиши их в конце ответа ТАК:\n"
                    "JSON_DATA: {\"role\": \"worker_или_employer\", \"entity_type\": \"physical_или_legal\"}"
                )
            }

        # СОСТОЯНИЕ 1: ВЕРИФИКАЦИЯ (профиль есть, но уровень верификации < 1)
        if current_user.profile.verification_level < 1:
            return {
                "role": "system",
                "content": (
                    "Ты — ассистент верификации профиля на платформе 'СТРОИК'.\n"
                    "Твоя ЕДИНСТВЕННАЯ задача: собрать личные данные для верификации.\n\n"
                    "Спроси у пользователя:\n"
                    "1️⃣ ФИО (Фамилия Имя Отчество, например: Иванов Иван Иванович)\n"
                    "2️⃣ Город проживания или работы (например: Москва)\n\n"
                    f"{base_rules}"
                    "Когда получил оба ответа, запиши их ТАК:\n"
                    "JSON_DATA: {\"fio\": \"ФИО_пользователя\", \"location\": \"город\", \"verification_level\": 1}"
                )
            }

        # СОСТОЯНИЕ 2: ОБНОВЛЕНИЕ ПРОФИЛЯ (уровень верификации >= 1)
        return {
            "role": "system",
            "content": (
                "Ты — помощник по развитию профиля на платформе 'СТРОИК'.\n"
                "Помогай пользователю описывать проекты, добавлять навыки или требования.\n\n"
                "ВАЖНО про легальные фильтры:\n"
                "- Если пользователь говорит 'нужны русские' → переведи в language_proficiency='Свободное владение русским языком'\n"
                "- Если 'с визой' или 'граждане РФ' → переведи в work_authorization='Гражданство РФ/Патент/ВНЖ'\n"
                "Это легально, этично и решает проблему качества коммуникации.\n\n"
                f"{base_rules}"
                "Если пользователь просит обновить данные (язык, авторизацию, навыки), запиши ТАК:\n"
                "JSON_DATA: {\"field_name\": \"value\"}"
            )
        }

    async def generate_response(self, messages: List[Message], current_user=None) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Возвращает кортеж: (текст_для_пользователя, извлеченные_данные_json_если_есть).
        
        Args:
            messages: История сообщений
            current_user: Текущий пользователь (если авторизован)
            
        Returns:
            Кортеж (ответ_текст, данные_для_обновления_или_None)
        """
        # Получаем правильный промпт для текущего состояния
        system_prompt = self._get_prompt_for_state(current_user)
        
        # Формируем сообщения: системный промпт + история
        formatted_messages = [system_prompt]
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        try:
            response = ollama.chat(model=self.model_name, messages=formatted_messages)
            content = response['message']['content'].strip()
            
            # Пытаемся извлечь JSON из ответа
            if "JSON_DATA:" in content:
                try:
                    # Ищем JSON после маркера JSON_DATA:
                    json_str = content.split("JSON_DATA:")[1].strip()
                    # Извлекаем валидный JSON (может быть завернут в текст)
                    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', json_str)
                    if json_match:
                        extracted_data = json.loads(json_match.group(0))
                        # Убираем технический блок из ответа пользователю
                        clean_reply = content.split("JSON_DATA:")[0].strip()
                        logger.info(f"✅ JSON успешно извлечен: {extracted_data}")
                        return (clean_reply, {"status": "update", "data": extracted_data})
                except (json.JSONDecodeError, IndexError, AttributeError) as e:
                    logger.warning(f"⚠️  Не удалось распарсить JSON: {e}")
                    # Возвращаем текст без JSON, если парсинг сломался
                    return (content, None)
                    
            return (content, None)
            
        except Exception as e:
            logger.error(f"❌ Ошибка Ollama: {e}")
            return ("Извините, сейчас я испытываю технические трудности. Попробуйте еще раз.", None)
