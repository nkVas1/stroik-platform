import json
import logging
import ollama

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name

    def _get_prompt_for_state(self, user) -> dict:
        base_rules = (
            "ТЫ ОБЯЗАН ОТВЕЧАТЬ СТРОГО В ФОРМАТЕ JSON.\n"
            "Твой ответ должен содержать ровно ТРИ ключа:\n"
            "1. 'thought_process' (Твои мысли: проанализируй слова пользователя, сделай логические выводы).\n"
            "2. 'message' (Твой ответ пользователю СТРОГО НА РУССКОМ ЯЗЫКЕ. Веди диалог гибко. Задавай только ОДИН уточняющий вопрос за раз).\n"
            "3. 'extracted_data' (JSON с собранными данными, если цель достигнута ПОЛНОСТЬЮ. Иначе null).\n\n"
        )

        if not user or user.profile.role.value == "unknown":
            return {
                "role": "system",
                "content": base_rules + (
                    "ЦЕЛЬ ФАЗЫ 0: Узнать 2 параметра для старта.\n"
                    "1. Роль: ищет работу ('worker') ИЛИ ищет специалистов ('employer').\n"
                    "2. Тип лица: физическое/частник ('physical') ИЛИ компания/юр.лицо ('legal').\n"
                    "КРИТИЧЕСКОЕ ПРАВИЛО: Если человек называет профессию (сварщик, плиточник), ты делаешь логический вывод, что его роль = 'worker'. НО ты ОБЯЗАН продолжить диалог и уточнить, работает ли он как частник или от фирмы.\n"
                    "ПОКА ТЫ НЕ УБЕДИШЬСЯ, ЧТО У ТЕБЯ ЕСТЬ И РОЛЬ, И ТИП ЛИЦА, поле 'extracted_data' должно оставаться null!\n"
                    "Пример успеха (ТОЛЬКО если оба параметра известны): {\"thought_process\": \"Понял роль и тип лица.\", \"message\": \"Отлично, профиль создается...\", \"extracted_data\": {\"role\": \"worker\", \"entity_type\": \"physical\"}}"
                )
            }

        if user.profile.verification_level.value < 1:
            return {
                "role": "system",
                "content": base_rules + (
                    "ЦЕЛЬ ФАЗЫ 1: Верификация. Узнай ФИО и Город.\n"
                    "Улавливай имена и города из контекста (например 'Я Иван из Москвы').\n"
                    "Если оба параметра ясны, верни: {\"thought_process\": \"...\", \"message\": \"Данные сохранены.\", \"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"fio\": \"Иван\", \"location\": \"Москва\", \"verification_level\": 1}}}"
                )
            }

        if user.profile.role.value == "employer":
            return {
                "role": "system",
                "content": base_rules + (
                    "ЦЕЛЬ ФАЗЫ 2: Помочь заказчику создать ТЗ (Техническое задание) для строителей.\n"
                    "Узнай: 1. Суть задачи (что строить/ремонтировать), 2. Бюджет (в рублях).\n"
                    "Если данные собраны, верни: {\"thought_process\": \"...\", \"message\": \"Заказ опубликован!\", \"extracted_data\": {\"action\": \"create_project\", \"data\": {\"title\": \"Название\", \"description\": \"Детали\", \"budget\": 50000, \"required_specialization\": \"профессия\"}}}"
                )
            }
            
        return {
            "role": "system",
            "content": base_rules + "ЦЕЛЬ ФАЗЫ 2: Помогать специалисту. Если он называет новый навык, верни: {\"thought_process\": \"...\", \"message\": \"...\", \"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"specialization\": \"новые навыки\"}}}"
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
                logger.info(f"🧠 ИИ подумал: {thought}")
            
            reply_text = data.get("message", "Секунду, обрабатываю данные...")
            extracted = data.get("extracted_data")
            
            if extracted:
                action = extracted.get("action", "update_profile")
                payload = extracted.get("data", extracted)
                return reply_text, {"action": action, "data": payload}
            
            return reply_text, None

        except Exception as e:
            logger.error(f"Ollama Error: {e}")
            return "Извините, я запутался. Давайте уточним ваш последний ответ.", None

        if user.profile.verification_level.value < 1:
            return {
                "role": "system",
                "content": base_rules + (
                    "ЦЕЛЬ ФАЗЫ 1: Узнать ФИО и Город проживания.\n"
                    "Улавливай имена и города прямо из текста (например 'Я Иван из Москвы').\n"
                    "Если оба параметра ясны, верни: {\"thought_process\": \"...\", \"message\": \"Данные сохранены.\", \"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"fio\": \"Иван\", \"location\": \"Москва\", \"verification_level\": 1}}}"
                )
            }

        if user.profile.role.value == "employer":
            return {
                "role": "system",
                "content": base_rules + (
                    "ЦЕЛЬ: Помочь заказчику создать ТЗ для строителей.\n"
                    "Узнай: 1. Суть задачи (что строить/ремонтировать), 2. Бюджет (в рублях).\n"
                    "Если данные собраны, верни: {\"thought_process\": \"...\", \"message\": \"Заказ опубликован!\", \"extracted_data\": {\"action\": \"create_project\", \"data\": {\"title\": \"Название\", \"description\": \"Детали\", \"budget\": 50000, \"required_specialization\": \"профессия\"}}}"
                )
            }
            
        return {
            "role": "system",
            "content": base_rules + "ЦЕЛЬ: Помогать специалисту добавлять навыки. Если назвал новый навык, верни: {\"thought_process\": \"...\", \"message\": \"...\", \"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"specialization\": \"новые навыки\"}}}"
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
            
            # Логируем мысли ИИ для отладки
            thought = data.get("thought_process", "")
            logger.info(f"🧠 ИИ подумал: {thought}")
            
            reply_text = data.get("message", "Секунду, обрабатываю данные...")
            extracted = data.get("extracted_data")
            
            if extracted:
                action = extracted.get("action", "update_profile")
                payload = extracted.get("data", extracted)
                return reply_text, {"action": action, "data": payload}
            
            return reply_text, None

        except Exception as e:
            logger.error(f"Ollama Error: {e}")
            return "Извините, я запутался. Давайте уточним ваш последний ответ.", None
