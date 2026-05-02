"""
Hybrid LLM service for the СТРОИК AI assistant.

Onboarding state machine (Phase 10):
  1. Онбординг     — role + entity_type
  2. Аутентифик. — email + password  <-- NEW
  3. Верификация  — fio + location
  4a. Портфолио  — specialization (worker)
  4b. ТЗ             — create_project (employer)
"""

from __future__ import annotations

import json
import logging
from typing import Optional, Tuple

import ollama

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from google import genai
    from google.genai import types as genai_types
    _GENAI_AVAILABLE = True
except Exception as _gen_import_err:
    genai = None
    genai_types = None
    _GENAI_AVAILABLE = False
    logger.info(
        "google-genai SDK не установлен (%s). Будет использоваться только локальная LLM.",
        _gen_import_err,
    )


class LLMService:
    """High-level LLM orchestration with seamless Gemini → Ollama fallback."""

    def __init__(self) -> None:
        self.primary_model = settings.gemini_model
        self.fallback_model = settings.ollama_model
        self._gemini_client: Optional[object] = None

        api_key = settings.google_api_key_or_none
        if _GENAI_AVAILABLE and api_key:
            try:
                self._gemini_client = genai.Client(api_key=api_key)
                logger.info("✅ Gemini клиент инициализирован (model=%s)", self.primary_model)
            except Exception as exc:
                logger.warning("⚠️ Не удалось инициализировать Gemini-клиент: %s", exc)
        else:
            logger.info("ℹ️ Gemini отключён. Работаем на Ollama.")

        import os
        os.environ.setdefault("OLLAMA_HOST", settings.ollama_host)

    # ── State Machine ───────────────────────────────────────────────────
    def _get_system_instruction(self, user) -> str:
        base = (
            "ТЫ ОБЯЗАН ОТВЕЧАТЬ СТРОГО В ФОРМАТЕ JSON.\n"
            "Структура ответа:\n"
            "{\n"
            '  "thought_process": "\u0422вои рассуждения. Проверь чек-лист.",\n'
            '  "message": "\u0422вой вежливый ответ пользователю (без JSON лешних символов).",\n'
            '  "extracted_data": {"action": "...", "data": {...}} // ЗАПОЛНЯТЬ ТОЛЬКО ПРИ 100% ВЫПОЛНЕНИИ ЦЕЛИ\n'
            "}\n\n"
        )

        # Фаза 0: Новый пользователь, роль не определена
        if not user or user.profile.role.value == "unknown":
            return base + (
                "ФАЗА: Онбординг.\n"
                "ЦЕЛЬ: Узнать 2 параметра: Роль ('worker' ИЛИ 'employer') и Тип лица ('physical' ИЛИ 'legal').\n"
                "- Называет профессию (плиточник, электрик) → роль 'worker'. Осталось узнать тип лица.\n"
                "- Ищёт рабочих, специалистов → роль 'employer'. Осталось узнать тип лица.\n"
                "НЕ заполняй 'extracted_data', пока не узнаешь ОБА параметра."
            )

        # Фаза 1: Учётные данные (email + пароль)
        # Срабатывает после онбординга, если у пользователя нет email на аккаунте
        if not user.email:
            return base + (
                "ФАЗА: Учётные данные.\n"
                "ЦЕЛЬ: Узнать email-адрес и пароль для аккаунта.\n"
                "Правила:\n"
                "- Email должен содержать @ и домен.\n"
                "- Пароль от 6 до 128 символов.\n"
                "- Сначала спроси email, затем пароль.\n"
                "- Попроси подтверждение пароля, если пользователь ввёл его первый раз.\n"
                "Когда оба параметра получены, верни:\n"
                '{"action": "attach_email", "data": {"email": "user@example.com", "password": "secret123"}}'
            )

        # Фаза 2: Верификация (ФИО + город)
        if user.profile.verification_level.value < 1:
            return base + (
                "ФАЗА: Верификация.\n"
                "ЦЕЛЬ: Узнать ФИО и Город.\n"
                'Если узнал оба параметра, верни: {"action": "update_profile", "data": {"fio": "Иван Иванов", "location": "Москва", "verification_level": 1}}'
            )

        # Фаза 3a: ТЗ для заказчика
        if user.profile.role.value == "employer":
            return base + (
                "ФАЗА: Создание ТЗ.\n"
                "ЦЕЛЬ: Узнать Суть задачи (описание) и Бюджет (число).\n"
                'Если данные собраны, верни: {"action": "create_project", "data": {"title": "Название", "description": "ТЗ", "budget": 50000, "required_specialization": "специальность"}}'
            )

        # Фаза 3b: Портфолио специалиста
        return base + (
            "ФАЗА: Портфолио специалиста.\n"
            'Спрашивай про навыки. Если называет, верни: {"action": "update_profile", "data": {"specialization": "новые навыки"}}'
        )

    # ── Public API ──────────────────────────────────────────────────
    async def generate_response(
        self,
        messages: list,
        current_user=None,
    ) -> Tuple[str, Optional[dict]]:
        system_instruction = self._get_system_instruction(current_user)

        if self._gemini_client is not None:
            try:
                return self._call_gemini(messages, system_instruction)
            except Exception as exc:
                logger.warning("⚠️ Отказ Gemini (%s). Переход на Ollama...", exc)

        try:
            return self._call_ollama(messages, system_instruction)
        except Exception as exc:
            logger.error("❌ Критический сбой LLM: %s", exc)
            return (
                "Извините, ИИ-ассистент сейчас недоступен. Вы можете заполнить профиль вручную.",
                None,
            )

    # ── Private helpers ─────────────────────────────────────────────
    def _call_gemini(self, messages: list, system_instruction: str) -> Tuple[str, Optional[dict]]:
        gemini_messages = []
        for msg in messages:
            if msg.role == "system":
                continue
            role = "user" if msg.role == "user" else "model"
            gemini_messages.append(
                genai_types.Content(
                    role=role,
                    parts=[genai_types.Part.from_text(text=msg.content)],
                )
            )
        response = self._gemini_client.models.generate_content(
            model=self.primary_model,
            contents=gemini_messages,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ),
        )
        return self._parse_llm_json(response.text, "GEMINI")

    def _call_ollama(self, messages: list, system_instruction: str) -> Tuple[str, Optional[dict]]:
        clean_messages = [{"role": "system", "content": system_instruction}]
        for msg in messages:
            clean_messages.append({"role": msg.role, "content": msg.content})
        response_ollama = ollama.chat(
            model=self.fallback_model,
            messages=clean_messages,
            format="json",
        )
        return self._parse_llm_json(response_ollama["message"]["content"], "OLLAMA")

    @staticmethod
    def _parse_llm_json(raw_content: str, engine_name: str) -> Tuple[str, Optional[dict]]:
        try:
            data = json.loads(raw_content)
            thought = data.get("thought_process", "")
            if thought:
                logger.info("⚡ %s МЫСЛИТ: %s", engine_name, thought)
            reply_text = data.get("message", "Обрабатываю...")
            extracted = data.get("extracted_data")
            if extracted:
                action = extracted.get("action", "update_profile")
                payload = extracted.get("data", extracted)
                return reply_text, {"action": action, "data": payload}
            return reply_text, None
        except Exception as exc:
            logger.error("Ошибка парсинга JSON от %s: %s", engine_name, exc)
            return "Я немного запутался, повторите пожалуйста.", None
