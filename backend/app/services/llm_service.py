import json
import logging
import ollama

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name

    def _get_prompt_for_state(self, user) -> dict:
        # Базовый жесткий корсет для JSON ответа
        json_rules = (
            "ТЫ ОБЯЗАН ОТВЕЧАТЬ СТРОГО В ФОРМАТЕ JSON.\n"
            "Ключи: 'thought_process' (твои мысли), 'message' (вежливый ответ пользователю в чат), 'extracted_data' (данные для БД или null).\n\n"
        )

        # ----------------------------------------------------
        # ФАЗА 0: ОНБОРДИНГ (НОВЫЙ ПОЛЬЗОВАТЕЛЬ)
        # ----------------------------------------------------
        if not user or user.profile.role.value == "unknown":
            return {
                "role": "system",
                "content": json_rules + (
                    "ТВОЯ РОЛЬ: ИИ-Рекрутер. Ты общаешься с новым пользователем.\n"
                    "ЦЕЛЬ: Узнать 2 параметра: Роль (worker/employer) и Тип лица (physical/legal).\n\n"
                    "ПРАВИЛА ИНТЕРПРЕТАЦИИ (ОЧЕНЬ ВАЖНО):\n"
                    "- Если человек называет профессию (сварщик, плиточник, прораб), значит его роль = 'worker'.\n"
                    "- Если человек говорит 'мой дом', 'мой коттедж', 'моя квартира', значит его тип лица = 'physical' (частное лицо).\n"
                    "- Если человек говорит 'ООО', 'фирма', 'компания', значит тип лица = 'legal'.\n\n"
                    "АЛГОРИТМ:\n"
                    "1. Вычисли роль из текста.\n"
                    "2. Если тип лица непонятен, спроси: 'Вы выступаете как частное лицо или от имени компании?'\n"
                    "3. НЕ возвращай данные в 'extracted_data', пока не будешь на 100% уверен и в РОЛИ, и в ТИПЕ ЛИЦА.\n\n"
                    "Пример успеха: {\"thought_process\": \"Пользователь сказал 'строю свой дом'. Значит роль employer, тип physical.\", \"message\": \"Отлично! Создаю ваш профиль...\", \"extracted_data\": {\"role\": \"employer\", \"entity_type\": \"physical\"}}"
                )
            }

        # ----------------------------------------------------
        # ФАЗА 1: ВЕРИФИКАЦИЯ (Профиль есть, но не верифицирован)
        # ----------------------------------------------------
        if user.profile.verification_level.value < 1:
            return {
                "role": "system",
                "content": json_rules + (
                    "ТВОЯ РОЛЬ: Служба Безопасности. Пользователь уже зарегистрирован!\n"
                    "ЗАБУДЬ ПРО ВОПРОСЫ О ПРОФЕССИИ. Твоя единственная цель — узнать ФИО и Город.\n\n"
                    "ПРАВИЛА:\n"
                    "- Вылавливай Имя и Город из любых предложений (например: 'Я Леха из Питера' -> ФИО: Алексей, Город: Санкт-Петербург).\n"
                    "- Если пользователь сопротивляется, вежливо объясни, что это нужно для безопасности сделок.\n"
                    "Если узнал ОБА параметра, верни: {\"thought_process\": \"Знаю ФИО и город.\", \"message\": \"Отлично, верификация пройдена!\", \"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"fio\": \"...\", \"location\": \"...\", \"verification_level\": 1}}}"
                )
            }

        # ----------------------------------------------------
        # ФАЗА 2: РАБОТА С ЗАКАЗЧИКОМ (Создание ТЗ)
        # ----------------------------------------------------
        if user.profile.role.value == "employer":
            return {
                "role": "system",
                "content": json_rules + (
                    "ТВОЯ РОЛЬ: Менеджер проектов. Перед тобой Заказчик.\n"
                    "ЗАБУДЬ про регистрацию и верификацию. ЦЕЛЬ: Создать ТЗ (заказ на работу).\n"
                    "Узнай: 1. Суть задачи (что конкретно сделать). 2. Бюджет.\n"
                    "Если человек говорит 'договоримся', 'не знаю', ставь бюджет = 0.\n"
                    "Если задача понятна, верни: {\"thought_process\": \"Понял задачу.\", \"message\": \"Супер, ваш заказ опубликован!\", \"extracted_data\": {\"action\": \"create_project\", \"data\": {\"title\": \"Название\", \"description\": \"Детальное ТЗ\", \"budget\": 50000, \"required_specialization\": \"кого ищем\"}}}"
                )
            }
            
        # ----------------------------------------------------
        # ФАЗА 2: РАБОТА СО СПЕЦИАЛИСТОМ
        # ----------------------------------------------------
        return {
            "role": "system",
            "content": json_rules + (
                "ТВОЯ РОЛЬ: HR-менеджер. Перед тобой Строитель/Специалист.\n"
                "ЗАБУДЬ про регистрацию. Помоги ему добавить навыки в профиль.\n"
                "Пример: {\"thought_process\": \"Добавил навык.\", \"message\": \"Добавил это в портфолио!\", \"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"specialization\": \"новые навыки\"}}}"
            )
        }

    async def generate_response(self, messages: list, current_user=None) -> tuple[str, dict]:
        system_prompt = self._get_prompt_for_state(current_user)
        
        clean_messages = [system_prompt]
        for msg in messages:
            clean_messages.append({"role": msg.role, "content": msg.content})

        try:
            response = ollama.chat(model=self.model_name, messages=clean_messages, format='json')
            raw_content = response['message']['content'].strip()
            
            data = json.loads(raw_content)
            
            thought = data.get("thought_process", "")
            if thought:
                logger.info(f"🧠 МЫСЛИ ИИ: {thought}")
            
            reply_text = data.get("message", "Секунду...")
            extracted = data.get("extracted_data")
            
            if extracted:
                action = extracted.get("action", "update_profile")
                payload = extracted.get("data", extracted)
                return reply_text, {"action": action, "data": payload}
            
            return reply_text, None

        except Exception as e:
            logger.error(f"❌ Ошибка LLM: {e}")
            return "Извините, я задумался. Уточните, пожалуйста.", None
