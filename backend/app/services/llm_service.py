import ollama
import logging
import json
from app.models.chat import Message
from typing import List, Tuple, Optional, Dict, Any

logger = logging.getLogger(__name__)

class LLMService:
    """
    Сервис взаимодействия с ИИ с поддержкой State Machine паттерна.
    Используется Native JSON Mode (format='json') для гарантированного структурированного вывода.
    """
    
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name

    def _get_prompt_for_state(self, current_user=None) -> Dict[str, str]:
        """
        Генерирует системный промпт, принуждающий модель к JSON-выводу через Native JSON Mode.
        
        Args:
            current_user: User объект из БД или None если гость
            
        Returns:
            Dict с role и content для системного промпта
        """
        
        base_rules = (
            "ТЫ ОБЯЗАН ОТВЕЧАТЬ СТРОГО В ФОРМАТЕ JSON.\n"
            "Твой ответ должен содержать ровно два ключа:\n"
            "1. 'message' (твой ответ пользователю СТРОГО НА РУССКОМ ЯЗЫКЕ).\n"
            "2. 'extracted_data' (JSON с собранными данными, если цель достигнута, иначе null).\n\n"
            "ПРАВИЛА:\n"
            "- Задавай только один вопрос за раз.\n"
            "- Если пользователь пишет не по теме, вежливо верни его к заполнению профиля.\n"
            "- Никогда не пиши пояснения вне JSON структуры.\n\n"
        )

        # СОСТОЯНИЕ 0: НОВЫЙ ПОЛЬЗОВАТЕЛЬ (нет профиля)
        if not current_user or not current_user.profile or current_user.profile.role == "unknown":
            return {
                "role": "system",
                "content": (
                    base_rules +
                    "ЦЕЛЬ: Узнать 2 параметра.\n"
                    "1. Роль: ищет работу ('worker') ИЛИ ищет специалистов ('employer').\n"
                    "2. Тип лица: физическое ('physical') ИЛИ компания ('legal').\n"
                    "Если ты узнал ОБА параметра, заполни 'extracted_data'.\n"
                    "ПРИМЕР УСПЕХА: {\"message\": \"Отлично, профиль создается...\", \"extracted_data\": {\"role\": \"worker\", \"entity_type\": \"physical\"}}"
                )
            }

        # СОСТОЯНИЕ 1: ВЕРИФИКАЦИЯ (профиль есть, но уровень верификации < 1)
        if current_user.profile.verification_level < 1:
            return {
                "role": "system",
                "content": (
                    base_rules +
                    "ЦЕЛЬ: Узнать ФИО и Город проживания.\n"
                    "Если пользователь назвал оба параметра, заполни 'extracted_data'.\n"
                    "ПРИМЕР УСПЕХА: {\"message\": \"Данные сохранены.\", \"extracted_data\": {\"fio\": \"Иван Иванов\", \"location\": \"Москва\", \"verification_level\": 1}}"
                )
            }

        # СОСТОЯНИЕ 2: СВОБОДНЫЙ ДИАЛОГ И СОЗДАНИЕ ТЗ (профиль заполнен)
        if current_user.profile.role.value == "employer":
            return {
                "role": "system",
                "content": (
                    base_rules +
                    "ЦЕЛЬ: Помочь заказчику создать ТЗ (Техническое задание) для поиска строителей.\n"
                    "Узнай: 1. Суть задачи (что строить/ремонтировать и детали), 2. Бюджет (в рублях).\n"
                    "Когда заказчик дал эти данные, заполни 'extracted_data' СТРОГО в формате:\n"
                    "{\"action\": \"create_project\", \"data\": {\"title\": \"Краткое название\", \"description\": \"Детальное ТЗ\", \"budget\": 50000, \"required_specialization\": \"нужная профессия\"}}\n"
                    "Пока собираешь информацию, 'extracted_data' должен быть null."
                )
            }
        else:
            return {
                "role": "system",
                "content": (
                    base_rules +
                    "ЦЕЛЬ: Помогать специалисту добавлять навыки в профиль.\n"
                    "Если он назвал новый навык, верни: {\"action\": \"update_profile\", \"data\": {\"specialization\": \"новые навыки\"}}"
                )
            }

    async def generate_response(self, messages: List[Message], current_user=None) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Возвращает кортеж: (текст_для_пользователя, извлеченные_данные_если_есть).
        Используется Native JSON Mode для гарантированного структурированного вывода.
        
        Args:
            messages: История сообщений
            current_user: Текущий пользователь (если авторизован)
            
        Returns:
            Кортеж (ответ_текст, данные_для_обновления_или_None)
        """
        system_prompt = self._get_prompt_for_state(current_user)
        
        # Собираем чистую историю сообщений
        clean_messages = [system_prompt]
        for msg in messages:
            clean_messages.append({"role": msg.role, "content": msg.content})

        try:
            # format='json' блокирует галлюцинации модели на уровне API Ollama
            response = ollama.chat(
                model=self.model_name, 
                messages=clean_messages,
                format='json'  # ← КРИТИЧНО: Native JSON Mode
            )
            
            raw_content = response['message']['content'].strip()
            logger.info(f"✅ Ollama JSON Response: {raw_content}")
            
            # Парсим гарантированный JSON
            data = json.loads(raw_content)
            reply_text = data.get("message", "Обрабатываю данные...")
            extracted = data.get("extracted_data")
            
            if extracted:
                # Определяем действие: по умолчанию update_profile для обратной совместимости
                action = extracted.get("action", "update_profile")
                payload = extracted.get("data", extracted)
                logger.info(f"📦 Извлечены данные: action={action}, data={payload}")
                return reply_text, {"action": action, "data": payload}
            
            return reply_text, None

        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON Parse Error: {e}")
            return "Извините, я немного запутался в форматах. Давайте уточним ваш последний ответ.", None
        except Exception as e:
            logger.error(f"❌ Ollama Error: {e}")
            return "Техническая заминка на сервере ИИ. Попробуйте отправить сообщение еще раз.", None
