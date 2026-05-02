"""
Hybrid LLM service — Gemini (primary) with Ollama fallback.

Onboarding state machine phases:
  Phase 0: role + entity_type  (guest → creates User+Profile, returns token)
  Phase 1: email + password    (guest token → attaches credentials to account)
  Phase 2: fio + location      (verification_level 0 → 1)
  Phase 3a: create_project     (employer flow)
  Phase 3b: specialization     (worker flow)

All phases emit JSON: {thought_process, message, extracted_data?}.
extracted_data: {action: str, data: dict}
"""

from __future__ import annotations

import json
import logging
from typing import Optional, Tuple

import ollama

from app.core.config import settings
from app.models.db_models import VerificationLevel

logger = logging.getLogger(__name__)

try:
    from google import genai
    from google.genai import types as genai_types
    _GENAI_AVAILABLE = True
except Exception as _e:
    genai = None          # type: ignore
    genai_types = None    # type: ignore
    _GENAI_AVAILABLE = False
    logger.info("ℹ️ google-genai недоступен (%s). Работаем на Ollama.", _e)


class LLMService:
    """High-level wrapper: Gemini → Ollama fallback, JSON-mode output."""

    def __init__(self) -> None:
        self.primary_model  = settings.gemini_model
        self.fallback_model = settings.ollama_model
        self._gemini_client: Optional[object] = None

        api_key = settings.google_api_key_or_none
        if _GENAI_AVAILABLE and api_key:
            try:
                self._gemini_client = genai.Client(api_key=api_key)
                logger.info("✅ Gemini инициализирован (model=%s)", self.primary_model)
            except Exception as exc:
                logger.warning("⚠️ Gemini init сбой: %s — работаем на Ollama", exc)
        else:
            logger.info("ℹ️ Gemini не настроен. Используем Ollama.");

        import os
        os.environ.setdefault("OLLAMA_HOST", settings.ollama_host)

    # ─────────────────────────────────────────────────────────────────────
    # State machine
    # ─────────────────────────────────────────────────────────────────────

    _JSON_FORMAT = (
        "ОТВЕЧАЙ ТОЛЬКО В ФОРМАТЕ JSON БЕЗ ЛЮБОГО ТЕКСТА ДО ИЛИ ПОСЛЕ.\n"
        "Структура:\n"
        "{\n"
        '  "thought_process": "\u0441ухой внутренний монолог (не виден пользователю)",\n'
        '  "message": "\u0442екст ответа пользователю",\n'
        '  "extracted_data": {"action": "...", "data": {...}}  // ТОЛЬКО при 100% уверенности\n'
        "}\n"
    )

    def _get_system_instruction(self, user) -> str:
        """Return phase-specific system prompt based on current user state."""

        # ─ Phase 0: no account yet ─────────────────────────────────────────
        if not user or user.profile is None or user.profile.role == "unknown":
            return self._JSON_FORMAT + (
                "ФАЗА 0: Онбординг.\n"
                "ЦЕЛЬ: узнать РОЛЬ (\'worker\' или \'employer\') \n"
                "  И ТИП ЛИЦА (\'physical\' или \'legal\').\n"
                "Правила определения:\n"
                "  - Упоминает профессию (плиточник, электрик, сантехник) → role=worker\n"
                "  - Ищёт рабочих, специалистов, хочет разместить заказ → role=employer\n"
                "  - Физлицо / не (ООО/ИП) → entity_type=physical / legal\n\n"
                "НЕ заполняй extracted_data, пока не знаешь ОБА параметра.\n"
                "Когда узнал оба — верни:\n"
                '{"action": "set_role", "data": {"role": "worker", "entity_type": "physical"}}'
            )

        # ─ Phase 1: no email attached yet ────────────────────────────────
        if not user.email:
            return self._JSON_FORMAT + (
                "ФАЗА 1: Учётные данные.\n"
                "ЦЕЛЬ: собрать email и пароль для входа в систему.\n"
                "Правила:\n"
                "  - Email должен содержать @ и домен.\n"
                "  - Пароль от 6 до 128 символов.\n"
                "  - Сначала спроси email, затем пароль, затем попроси подтвердить.\n"
                "  - Если пользователь сопротивляется — вырази понимание, что без email нельзя войти с другого устройства.\n"
                "Когда email и пароль собраны и подтверждены — верни:\n"
                '{"action": "attach_email", "data": {"email": "user@example.com", "password": "secret123"}}'
            )

        # ─ Phase 2: no fio/location yet ────────────────────────────────
        profile = user.profile
        # VerificationLevel is IntEnum: .value gives int, compare directly
        if profile.verification_level is None or profile.verification_level.value < VerificationLevel.BASIC.value:
            return self._JSON_FORMAT + (
                "ФАЗА 2: Верификация.\n"
                "ЦЕЛЬ: узнать ФИО и город.\n"
                "Когда узнал оба — верни:\n"
                '{"action": "update_profile", "data": {"fio": "Имя", "location": "Город", "verification_level": 1}}'
            )

        # ─ Phase 3a: employer ─ create project ─────────────────────────
        if profile.role == "employer":
            return self._JSON_FORMAT + (
                "ФАЗА 3: Техническое задание.\n"
                "ЦЕЛЬ: узнать название, описание задачи, бюджет и нужную специальность.\n"
                "Когда всё собрано — верни:\n"
                '{"action": "create_project", "data": {"title": "Название", "description": "ТЗ", "budget": 50000, "required_specialization": "спец."}}'  # noqa
            )

        # ─ Phase 3b: worker ─ specialization ───────────────────────────
        return self._JSON_FORMAT + (
            "ФАЗА 3: Портфолио.\n"
            "ЦЕЛЬ: узнать специализацию и опыт (years).\n"
            "Когда собрано — верни:\n"
            '{"action": "update_profile", "data": {"specialization": "Название", "experience_years": 5}}'
        )

    # ─────────────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────────────

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
                logger.warning("⚠️ Gemini сбой (%s). Фоллбэк на Ollama...", exc)

        try:
            return self._call_ollama(messages, system_instruction)
        except Exception as exc:
            logger.error("❌ Критический сбой LLM: %s", exc)
            return (
                "Извините, ИИ-ассистент сейчас недоступен. Попробуйте позже или заполните профиль вручную.",
                None,
            )

    # ─────────────────────────────────────────────────────────────────────
    # Private helpers
    # ─────────────────────────────────────────────────────────────────────

    def _call_gemini(
        self, messages: list, system_instruction: str
    ) -> Tuple[str, Optional[dict]]:
        contents = []
        for msg in messages:
            if msg.role == "system":
                continue
            role = "user" if msg.role == "user" else "model"
            contents.append(
                genai_types.Content(
                    role=role,
                    parts=[genai_types.Part.from_text(text=msg.content)],
                )
            )
        response = self._gemini_client.models.generate_content(  # type: ignore[union-attr]
            model=self.primary_model,
            contents=contents,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ),
        )
        return self._parse_llm_json(response.text, "GEMINI")

    def _call_ollama(
        self, messages: list, system_instruction: str
    ) -> Tuple[str, Optional[dict]]:
        formatted = [{"role": "system", "content": system_instruction}]
        for msg in messages:
            formatted.append({"role": msg.role, "content": msg.content})
        resp = ollama.chat(
            model=self.fallback_model,
            messages=formatted,
            format="json",
        )
        return self._parse_llm_json(resp["message"]["content"], "OLLAMA")

    @staticmethod
    def _parse_llm_json(
        raw: str, engine: str
    ) -> Tuple[str, Optional[dict]]:
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.error("Ошибка парсинга JSON от %s: %s | raw=%r", engine, exc, raw[:200])
            return "Повторите пожалуйста, возникла ошибка.", None

        thought = obj.get("thought_process", "")
        if thought:
            logger.debug("⚡ %s ДУМАЕТ: %s", engine, thought)

        reply = obj.get("message") or "Обрабатываю..."

        extracted = obj.get("extracted_data")
        if not extracted:
            return reply, None

        action  = extracted.get("action", "update_profile")
        payload = extracted.get("data", extracted)
        return reply, {"action": action, "data": payload}
