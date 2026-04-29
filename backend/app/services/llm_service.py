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
            "1. 'thought_process' (Внутренние мысли: проанализируй слова пользователя, проверь по чек-листу текущего этапа, какие данные уже есть, а каких не хватает).\n"
            "2. 'message' (Твой ответ пользователю СТРОГО НА РУССКОМ ЯЗЫКЕ. Веди диалог естественно. Задавай только ОДИН уточняющий вопрос за раз).\n"
            "3. 'extracted_data' (JSON с собранными данными. Заполняется ТОЛЬКО если чек-лист текущего этапа выполнен на 100%. Иначе пиши null).\n\n"
            "ОБЩИЕ ПРАВИЛА:\n"
            "- Если пользователь называет строительную профессию (сварщик, плиточник), это значит, что он ищет работу (роль: worker).\n"
            "- Если пользователь говорит 'нужен ремонт', 'ищу бригаду', это значит, что он заказчик (роль: employer).\n"
            "- Будь гибким. Если пользователь отвечает неформально, делай логические выводы из контекста.\n\n"
        )

        # ФАЗА 0: ОНБОРДИНГ
        if not user or user.profile.role.value == "unknown":
            return {
                "role": "system",
                "content": base_rules + (
                    "ТЕКУЩИЙ ЭТАП: Базовый онбординг.\n"
                    "ЧЕК-ЛИСТ (нужно узнать 2 параметра):\n"
                    "1. Роль: 'worker' (ищет работу) ИЛИ 'employer' (ищет строителей).\n"
                    "2. Тип лица: 'physical' (частное лицо/бригада) ИЛИ 'legal' (компания/ИП).\n\n"
                    "АЛГОРИТМ:\n"
                    "- Шаг 1: Проверь, понятна ли 'Роль'. Если нет - спроси.\n"
                    "- Шаг 2: Если 'Роль' понятна, проверь, понятен ли 'Тип лица'. Если нет - спроси (например: 'Вы работаете как частник или от фирмы?').\n"
                    "КРИТИЧЕСКИ ВАЖНО: Ключ 'extracted_data' должен оставаться null до тех пор, пока ты не будешь уверен в ОБОИХ параметрах (и Роль, и Тип лица)!\n"
                    "Пример УСПЕХА: {\"thought_process\": \"Знаю роль (worker) и тип лица (physical). Чек-лист выполнен.\", \"message\": \"Отлично, ваш профиль создается...\", \"extracted_data\": {\"role\": \"worker\", \"entity_type\": \"physical\"}}"
                )
            }

        # ФАЗА 1: ВЕРИФИКАЦИЯ
        if user.profile.verification_level.value < 1:
            return {
                "role": "system",
                "content": base_rules + (
                    "ТЕКУЩИЙ ЭТАП: Верификация профиля.\n"
                    "ЧЕК-ЛИСТ (нужно узнать 2 параметра):\n"
                    "1. ФИО (Имя Фамилия)\n"
                    "2. Город проживания/работы.\n\n"
                    "Вылавливай имена и города из контекста.\n"
                    "КРИТИЧЕСКИ ВАЖНО: Не заполняй 'extracted_data', пока не узнаешь И ФИО, И Город.\n"
                    "Пример УСПЕХА: {\"thought_process\": \"ФИО: Иван Иванов. Город: Москва. Чек-лист выполнен.\", \"message\": \"Данные успешно сохранены.\", \"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"fio\": \"Иван Иванов\", \"location\": \"Москва\", \"verification_level\": 1}}}"
                )
            }

        # ФАЗА 2: ЗАКАЗЧИК (СОЗДАНИЕ ТЗ)
        if user.profile.role.value == "employer":
            return {
                "role": "system",
                "content": base_rules + (
                    "ТЕКУЩИЙ ЭТАП: Создание Технического задания (ТЗ) для поиска строителей.\n"
                    "ЧЕК-ЛИСТ (нужно узнать 2 параметра):\n"
                    "1. Суть задачи (что строить/ремонтировать и какие специалисты нужны).\n"
                    "2. Бюджет (в рублях).\n\n"
                    "Если чек-лист выполнен, верни: {\"thought_process\": \"Знаю задачу и бюджет.\", \"message\": \"Ваш заказ опубликован на бирже!\", \"extracted_data\": {\"action\": \"create_project\", \"data\": {\"title\": \"Название проекта\", \"description\": \"Детальное ТЗ\", \"budget\": 50000, \"required_specialization\": \"нужная профессия\"}}}"
                )
            }
            
        # ФАЗА 2: РАБОЧИЙ (ДОПОЛНЕНИЕ ПРОФИЛЯ)
        return {
            "role": "system",
            "content": base_rules + (
                "ТЕКУЩИЙ ЭТАП: Свободное дополнение профиля специалиста.\n"
                "Если пользователь называет свои новые навыки, специальности или стаж работы, извлеки их.\n"
                "Пример: {\"thought_process\": \"Пользователь добавил навык сварки.\", \"message\": \"Навык добавлен в ваш профиль!\", \"extracted_data\": {\"action\": \"update_profile\", \"data\": {\"specialization\": \"Сварщик\"}}}"
            )
        }

    async def generate_response(self, messages: list, current_user=None) -> tuple[str, dict]:
        system_prompt = self._get_prompt_for_state(current_user)
        
        clean_messages = [system_prompt]
        for msg in messages:
            clean_messages.append({"role": msg.role, "content": msg.content})

        try:
            # Используем Ollama в режиме strict JSON
            response = ollama.chat(model=self.model_name, messages=clean_messages, format='json')
            raw_content = response['message']['content'].strip()
            
            data = json.loads(raw_content)
            
            # Логируем мыслительный процесс для отладки в терминале
            thought = data.get("thought_process", "")
            if thought:
                logger.info(f"🧠 МЫСЛИ ИИ: {thought}")
            
            reply_text = data.get("message", "Секунду, обрабатываю информацию...")
            extracted = data.get("extracted_data")
            
            if extracted:
                action = extracted.get("action", "update_profile")
                payload = extracted.get("data", extracted)
                return reply_text, {"action": action, "data": payload}
            
            return reply_text, None

        except Exception as e:
            logger.error(f"❌ Ошибка парсинга LLM: {e}")
            return "Извините, я запутался в своих рассуждениях. Не могли бы вы перефразировать?", None
