import json
import logging
from google import genai
from google.genai import types
import ollama

logger = logging.getLogger(__name__)

# 🔴 КРИТИЧЕСКИ ВАЖНО: Ключ API и настройка
GOOGLE_API_KEY = "AIzaSyDQtEO3mcz5DptflQMdqs4WRiWVrN6xPDE"

class LLMService:
    def __init__(self):
        # 🔴 КРИТИЧЕСКИ ВАЖНО: Гибридная конфигурация (Primary + Fallback)
        self.primary_model = 'gemini-3.1-flash-lite-preview' # Основная модель
        self.fallback_model = 'llama3'               # Локальный резерв
        
        # Инициализация нового SDK Google
        self.client = genai.Client(api_key=GOOGLE_API_KEY)

    def _get_system_instruction(self, user) -> str:
        """Динамически формирует инструкцию в зависимости от состояния пользователя в БД."""
        base_rules = (
            "ТЫ ОБЯЗАН ОТВЕЧАТЬ СТРОГО В ФОРМАТЕ JSON.\n"
            "Структура ответа:\n"
            "{\n"
            "  \"thought_process\": \"Твои рассуждения. Проверь чек-лист.\",\n"
            "  \"message\": \"Твой вежливый ответ пользователю в чат (1 вопрос).\",\n"
            "  \"extracted_data\": {\"action\": \"...\", \"data\": {...}} // ЗАПОЛНЯТЬ ТОЛЬКО ПРИ 100% ВЫПОЛНЕНИИ ЦЕЛИ\n"
            "}\n\n"
        )

        if not user or user.profile.role.value == "unknown":
            return base_rules + (
                "ФАЗА: Онбординг.\n"
                "ЦЕЛЬ: Узнать 2 параметра: Роль ('worker' ИЛИ 'employer') и Тип лица ('physical' ИЛИ 'legal').\n"
                "- Называет профессию (плиточник) -> роль 'worker'. Осталось узнать тип лица.\n"
                "- Ищет рабочих -> роль 'employer'. Осталось узнать тип лица.\n"
                "НЕ заполняй 'extracted_data', пока не узнаешь ОБА параметра."
            )

        if user.profile.verification_level.value < 1:
            return base_rules + (
                "ФАЗА: Верификация.\n"
                "ЦЕЛЬ: Узнать ФИО и Город.\n"
                "Если узнал оба параметра, верни: {\"action\": \"update_profile\", \"data\": {\"fio\": \"Иван Иванов\", \"location\": \"Москва\", \"verification_level\": 1}}"
            )

        if user.profile.role.value == "employer":
            return base_rules + (
                "ФАЗА: Создание ТЗ.\n"
                "ЦЕЛЬ: Узнать Суть задачи (описание) и Бюджет (число).\n"
                "Если данные собраны, верни: {\"action\": \"create_project\", \"data\": {\"title\": \"Название\", \"description\": \"ТЗ\", \"budget\": 50000, \"required_specialization\": \"специальность\"}}"
            )
            
        return base_rules + (
            "ФАЗА: Портфолио специалиста.\n"
            "Спрашивай про навыки. Если называет, верни: {\"action\": \"update_profile\", \"data\": {\"specialization\": \"новые навыки\"}}"
        )

    async def generate_response(self, messages: list, current_user=None) -> tuple[str, dict]:
        system_instruction = self._get_system_instruction(current_user)
        
        # 🔴 КРИТИЧЕСКИ ВАЖНО: Попытка 1 - Используем Gemini (Primary) через НОВЫЙ SDK
        try:
            gemini_messages = []
            for msg in messages:
                if msg.role == "system": continue
                role = "user" if msg.role == "user" else "model"
                # Используем правильный синтаксис нового пакета google.genai
                gemini_messages.append(
                    types.Content(role=role, parts=[types.Part.from_text(text=msg.content)])
                )

            response = self.client.models.generate_content(
                model=self.primary_model,
                contents=gemini_messages,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                )
            )
            return self._parse_llm_json(response.text, "GEMINI")
            
        except Exception as e_gemini:
            logger.warning(f"⚠️ Отказ Gemini ({e_gemini}). Бесшовный переход на локальную LLaMA 3...")
            
            # 🔴 КРИТИЧЕСКИ ВАЖНО: Попытка 2 - Используем Ollama (Fallback)
            try:
                clean_messages = [{"role": "system", "content": system_instruction}]
                for msg in messages:
                    clean_messages.append({"role": msg.role, "content": msg.content})

                response_ollama = ollama.chat(model=self.fallback_model, messages=clean_messages, format='json')
                return self._parse_llm_json(response_ollama['message']['content'], "LLAMA3")
                
            except Exception as e_ollama:
                logger.error(f"❌ Критический сбой обеих ИИ-систем: {e_ollama}")
                return "Технические неполадки нейросети. Попробуйте позже.", None

    def _parse_llm_json(self, raw_content: str, engine_name: str) -> tuple[str, dict]:
        """Универсальный парсер JSON для обеих нейросетей"""
        try:
            data = json.loads(raw_content)
            thought = data.get("thought_process", "")
            if thought:
                logger.info(f"⚡ {engine_name} МЫСЛИТ: {thought}")
            
            reply_text = data.get("message", "Обрабатываю...")
            extracted = data.get("extracted_data")
            
            if extracted:
                action = extracted.get("action", "update_profile")
                payload = extracted.get("data", extracted)
                return reply_text, {"action": action, "data": payload}
            
            return reply_text, None
        except Exception as e:
            logger.error(f"Ошибка парсинга JSON от {engine_name}: {e}")
            return "Я немного запутался в форматах, повторите пожалуйста.", None
