"""
Hybrid LLM service — Gemini (primary) with Ollama fallback.

Onboarding state machine phases (determined by DB state of current_user):
  Phase 0 — Role & entity type  (user has no account yet, or role=unknown)
  Phase 1 — Email + password    (user exists but has no email; UI handles the
                                  actual /api/auth/attach-email call, LLM only
                                  prompts and confirms)
  Phase 2 — Verification        (fio + location → verification_level ≥ BASIC)
  Phase 3a — Employer TZ        (create first project)
  Phase 3b — Worker portfolio   (specialization + skills)
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
except Exception as _e:
    genai = None           # type: ignore
    genai_types = None     # type: ignore
    _GENAI_AVAILABLE = False
    logger.info("google-genai SDK unavailable (%s). Using Ollama only.", _e)


class LLMService:
    """Orchestrate Gemini → Ollama calls with shared JSON state-machine prompts."""

    def __init__(self) -> None:
        self.primary_model  = settings.gemini_model
        self.fallback_model = settings.ollama_model
        self._gemini_client: Optional[object] = None

        import os
        os.environ.setdefault("OLLAMA_HOST", settings.ollama_host)

        api_key = settings.google_api_key_or_none
        if _GENAI_AVAILABLE and api_key:
            try:
                self._gemini_client = genai.Client(api_key=api_key)  # type: ignore[union-attr]
                logger.info("✅ Gemini client ready (model=%s)", self.primary_model)
            except Exception as exc:
                logger.warning("⚠️ Gemini init failed: %s", exc)
        else:
            logger.info("ℹ️ Gemini disabled — using Ollama (%s).", self.fallback_model)

    # ---------------------------------------------------------------- prompt

    def _system_prompt(self, user) -> str:  # noqa: ANN001
        """Return the correct system instruction based on current onboarding phase."""
        base = (
            "ТЫ ОБЯЗАН ОТВЕЧАТЬ СТРОГО В ФОРМАТЕ JSON.\n"
            "Структура ответа:\n"
            "{\n"
            '  "thought_process": "<рассуждения>",\n'
            '  "message": "<вежливый ответ без JSON-символов>",\n'
            '  "extracted_data": null  // заполняй ТОЛЬКО при 100% уверенности\n'
            "}\n\n"
        )

        # ─ Phase 0: define role + entity type ────────────────────────────────
        profile = getattr(user, "profile", None) if user else None
        role_val = profile.role.value if profile else "unknown"

        if user is None or profile is None or role_val == "unknown":
            return base + (
                "ФАЗА 0: Онбординг.\n"
                "ЦЕЛЬ: Узнать два параметра:\n"
                "  1. Роль: 'worker' (ищет работу) или 'employer' (ищет специалистов).\n"
                "  2. Тип лица: 'physical' (физлицо) или 'legal' (юрлицо).\n"
                "Примеры: плиточник/электрик → worker; ищу бригаду → employer.\n"
                "НЕ заполняй extracted_data, пока не известны ОБА параметра.\n"
                'Когда узнал оба: {"action": "create_account", "data": {"role": "worker", "entity_type": "physical"}}'
            )

        # ─ Phase 1: attach email + password ─────────────────────────────
        if not user.email:
            return base + (
                "ФАЗА 1: Учётные данные.\n"
                "ЦЕЛЬ: Попроси email-адрес и пароль. Сообщи, что это нужно для входа в аккаунт с любого устройства.\n"
                "Правила:\n"
                "  • email должен содержать @.\n"
                "  • пароль от 6 до 128 символов.\n"
                "  • Сначала спроси email, затем пароль, затем подтверждение пароля.\n"
                "IMPORTANT: extracted_data здесь не применяется. Просто попроси данные и сообщи, что фронт покажет форму.\n"
                "extracted_data: null  // всегда null на этой фазе"
            )

        # ─ Phase 2: verification (fio + location) ───────────────────────
        from app.models.db_models import VerificationLevel as VL
        vl = profile.verification_level  # IntEnum
        if vl < VL.BASIC:
            return base + (
                "ФАЗА 2: Верификация.\n"
                "ЦЕЛЬ: Узнать ФИО и Город/Регион.\n"
                "НЕ заполняй extracted_data пока не узнал ОБА параметра.\n"
                'Когда узнал: {"action": "update_profile", "data": {"fio": "Иванов Иван", "location": "Москва"}}'
            )

        # ─ Phase 3a: employer ─ create first project ──────────────────────
        if profile.role.value == "employer":
            return base + (
                "ФАЗА 3a: Создание ТЗ.\n"
                "ЦЕЛЬ: Узнать Описание задачи и Бюджет (число в рублях).\n"
                "Не заполняй extracted_data пока не известны ОБА параметра.\n"
                'Когда известны: {"action": "create_project", "data": {"title": "Замена труб", "description": "Описание", "budget": 50000, "required_specialization": "сантехник"}}'
            )

        # ─ Phase 3b: worker ─ fill portfolio ─────────────────────────────
        return base + (
            "ФАЗА 3b: Портфолио специалиста.\n"
            "ЦЕЛЬ: Узнать Специализацию и Опыт (лет).\n"
            "Не заполняй extracted_data пока не известны оба параметра.\n"
            'Когда известны: {"action": "update_profile", "data": {"specialization": "электрик", "experience_years": 5}}'
        )

    # ---------------------------------------------------------------- public API

    async def generate_response(
        self,
        messages: list,
        current_user=None,
    ) -> Tuple[str, Optional[dict]]:
        system_prompt = self._system_prompt(current_user)

        if self._gemini_client is not None:
            try:
                return self._call_gemini(messages, system_prompt)
            except Exception as exc:
                logger.warning("⚠️ Gemini error (%s). Falling back to Ollama.", exc)

        try:
            return self._call_ollama(messages, system_prompt)
        except Exception as exc:
            logger.error("❌ LLM critical failure: %s", exc, exc_info=True)
            return (
                "Извините, ассистент недоступен. Попробуйте чуть позже.",
                None,
            )

    # ---------------------------------------------------------------- backends

    def _call_gemini(self, messages: list, system_prompt: str) -> Tuple[str, Optional[dict]]:
        contents = []
        for msg in messages:
            if msg.role == "system":
                continue
            role = "user" if msg.role == "user" else "model"
            contents.append(
                genai_types.Content(  # type: ignore[union-attr]
                    role=role,
                    parts=[genai_types.Part.from_text(text=msg.content)],  # type: ignore[union-attr]
                )
            )
        response = self._gemini_client.models.generate_content(  # type: ignore[union-attr]
            model=self.primary_model,
            contents=contents,
            config=genai_types.GenerateContentConfig(  # type: ignore[union-attr]
                system_instruction=system_prompt,
                response_mime_type="application/json",
            ),
        )
        return self._parse_json(response.text, "GEMINI")

    def _call_ollama(self, messages: list, system_prompt: str) -> Tuple[str, Optional[dict]]:
        clean = [{"role": "system", "content": system_prompt}]
        clean += [{"role": m.role, "content": m.content} for m in messages]
        resp = ollama.chat(model=self.fallback_model, messages=clean, format="json")
        return self._parse_json(resp["message"]["content"], "OLLAMA")

    @staticmethod
    def _parse_json(raw: str, engine: str) -> Tuple[str, Optional[dict]]:
        try:
            data = json.loads(raw)
        except Exception as exc:
            logger.error("❌ JSON parse error from %s: %s | raw=%.200s", engine, exc, raw)
            return "Повторите запрос, пожалуйста.", None

        thought = data.get("thought_process", "")
        if thought:
            logger.debug("⚡ %s THOUGHT: %s", engine, thought)

        reply    = data.get("message", "Обрабатываю...") or "Обрабатываю..."
        extracted = data.get("extracted_data")

        if not extracted:
            return reply, None

        action  = extracted.get("action", "update_profile")
        payload = extracted.get("data", extracted)

        # Phase 0 compat: LLM may emit action=\"create_account\" or just include \"role\"
        if action == "create_account" or "role" in payload:
            action = "create_account"

        return reply, {"action": action, "data": payload}
