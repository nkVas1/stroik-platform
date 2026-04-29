import json
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Инициализация Gemini API (в продакшене перенесем в .env)
GOOGLE_API_KEY = "AIzaSyBKvwLV8KMW6V5i_sbkoWLiZCL377E0qUI"
genai.configure(api_key=GOOGLE_API_KEY)

class LLMService:
    def __init__(self):
        # Используем самую быструю и умную модель для диалогов
        self.model_name = 'gemini-1.5-flash'

    def _get_system_instruction(self, user) -> str:
        """Динамически формирует инструкцию в зависимости от состояния пользователя в БД."""
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
                "- Если человек говорит 'нужен ремонт', 'ищу бригаду', значит роль - 'employer'. ОСТАНЕТСЯ узнать тип лица (физ. лицо или юр. лицо).\n"
                "НЕ заполняй 'extracted_data', пока не узнаешь ОБА параметра.\n"
                "Пример успеха: {\"extracted_data\": {\"role\": \"worker\", \"entity_type\": \"physical\"}}"
            )

        # ФАЗА 1: ВЕРИФИКАЦИЯ
        if user.profile.verification_level.value < 1:
            role_name = "Заказчик" if user.profile.role.value == "employer" else "Мастер"
            return base_rules + (
                f"ТЕКУЩАЯ ФАЗА: Верификация. Пользователь ({role_name}) УЖЕ ЗАРЕГИСТРИРОВАН.\n"
                "ЦЕЛЬ: Узнать ФИО (Фамилия и Имя) и Город проживания/работы.\n"
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
            "Пользователь — верифицированный строитель/мастер.\n"
            "Спрашивай про его навыки, опыт работы или готовность взять заказ.\n"
            "Если он называет новый навык, верни: {\"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"specialization\": \"новые навыки\"}}}"
        )

    async def generate_response(self, messages: list, current_user=None) -> tuple[str, dict]:
        system_instruction = self._get_system_instruction(current_user)
        
        # Настройка модели Gemini с принудительным JSON-выводом
        model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_instruction,
            generation_config={"response_mime_type": "application/json"}
        )

        # Конвертация истории сообщений в формат Gemini (user и model)
        gemini_messages = []
        for msg in messages:
            # Пропускаем системные сообщения от фронтенда (ошибки)
            if msg.role == "system": continue
            
            # Gemini понимает только 'user' и 'model'
            role = "user" if msg.role == "user" else "model"
            gemini_messages.append({"role": role, "parts": [msg.content]})

        try:
            # Запрос к Google Gemini API
            response = model.generate_content(gemini_messages)
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
            return "Произошла ошибка связи с нейросетью. Попробуйте еще раз.", None
