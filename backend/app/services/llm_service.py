import json
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# Твой API ключ (в будущем перенесем в .env файл)
GOOGLE_API_KEY = "AIzaSyBKvwLV8KMW6V5i_sbkoWLiZCL377E0qUI"

class LLMService:
    def __init__(self, model_name: str = 'gemini-2.5-flash'):
        self.model_name = model_name
        self.client = genai.Client(api_key=GOOGLE_API_KEY)

    def _get_system_instruction(self, user) -> str:
        base_rules = (
            "ТЫ ОБЯЗАН ОТВЕЧАТЬ СТРОГО В ФОРМАТЕ JSON.\n"
            "Структура твоего ответа:\n"
            "{\n"
            "  \"thought_process\": \"Твои внутренние рассуждения. Делай логические выводы из слов пользователя.\",\n"
            "  \"message\": \"Твой вежливый ответ пользователю в чат на русском языке. Задавай только 1 вопрос.\",\n"
            "  \"extracted_data\": {\"action\": \"...\", \"data\": {...}} // ЗАПОЛНЯТЬ ТОЛЬКО ЕСЛИ ЦЕЛЬ ФАЗЫ ВЫПОЛНЕНА НА 100%, иначе null\n"
            "}\n\n"
        )

        # ФАЗА 0: ОНБОРДИНГ
        if not user or user.profile.role.value == "unknown":
            return base_rules + (
                "ТЕКУЩАЯ ФАЗА: Знакомство с новым пользователем.\n"
                "ЦЕЛЬ: Узнать 2 параметра: Роль ('worker' ИЛИ 'employer') и Тип лица ('physical' ИЛИ 'legal').\n"
                "ПРАВИЛА ЛОГИКИ:\n"
                "- Если человек называет профессию (сварщик, плиточник), значит его роль - 'worker'. ОСТАНЕТСЯ узнать тип лица (частник или фирма).\n"
                "- Если человек говорит 'нужен ремонт', 'ищу бригаду', значит роль - 'employer'. ОСТАНЕТСЯ узнать тип лица.\n"
                "НЕ заполняй 'extracted_data', пока не узнаешь ОБА параметра.\n"
                "Пример успеха: {\"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"role\": \"worker\", \"entity_type\": \"physical\"}}}"
            )

        # ФАЗА 1: ВЕРИФИКАЦИЯ
        if user.profile.verification_level.value < 1:
            role_name = "Заказчик" if user.profile.role.value == "employer" else "Мастер"
            return base_rules + (
                f"ТЕКУЩАЯ ФАЗА: Верификация. Пользователь ({role_name}) УЖЕ ЗАРЕГИСТРИРОВАН.\n"
                "ЦЕЛЬ: Узнать ФИО (Фамилия и Имя) и Город проживания.\n"
                "НЕ СПРАШИВАЙ про профессию или тип лица! Спрашивай ТОЛЬКО ФИО и Город.\n"
                "Если узнал оба параметра, верни: {\"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"fio\": \"Иван Иванов\", \"location\": \"Москва\", \"verification_level\": 1}}}"
            )

        # ФАЗА 2: ЗАКАЗЧИК (СОЗДАНИЕ ТЗ)
        if user.profile.role.value == "employer":
            return base_rules + (
                "ТЕКУЩАЯ ФАЗА: Создание проекта (ТЗ) для поиска строителей.\n"
                "Пользователь — верифицированный заказчик.\n"
                "ЦЕЛЬ: Узнать Суть задачи (описание объекта) и Бюджет (число в рублях).\n"
                "Если данные собраны, верни: {\"extracted_data\": {\"action\": \"create_project\", \"data\": {\"title\": \"Название\", \"description\": \"ТЗ\", \"budget\": 50000, \"required_specialization\": \"специальность\"}}}"
            )
            
        # ФАЗА 2: РАБОЧИЙ (ПОРТФОЛИО)
        return base_rules + (
            "ТЕКУЩАЯ ФАЗА: Дополнение профиля специалиста.\n"
            "Пользователь — верифицированный мастер.\n"
            "Спрашивай про его навыки, опыт работы.\n"
            "Если он называет новый навык, верни: {\"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"specialization\": \"новые навыки\"}}}"
        )

    async def generate_response(self, messages: list, current_user=None) -> tuple[str, dict]:
        system_instruction = self._get_system_instruction(current_user)
        
        # Конвертируем сообщения в формат нового Google GenAI SDK
        gemini_messages = []
        for msg in messages:
            if msg.role == "system": continue
            role = "user" if msg.role == "user" else "model"
            gemini_messages.append(
                types.Content(role=role, parts=[types.Part.from_text(msg.content)])
            )

        try:
            # Запрос к Gemini 2.5 Flash с принудительным JSON-выводом
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=gemini_messages,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                )
            )
            
            raw_content = response.text
            data = json.loads(raw_content)
            
            thought = data.get("thought_process", "")
            logger.info(f"⚡ GEMINI МЫСЛИТ: {thought}")
            
            reply_text = data.get("message", "Секунду, обрабатываю...")
            extracted = data.get("extracted_data")
            
            if extracted:
                action = extracted.get("action", "update_profile")
                payload = extracted.get("data", extracted)
                return reply_text, {"action": action, "data": payload}
            
            return reply_text, None

        except Exception as e:
            logger.error(f"❌ Ошибка Gemini API: {e}")
            return "Произошла ошибка связи с ИИ. Попробуйте еще раз.", None
