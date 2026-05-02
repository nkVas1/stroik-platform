"""
Hybrid LLM service — Gemini primary, Ollama fallback.

Onboarding state machine phases (driven by User DB state):
  0. No profile / role=unknown  → action: set_role
  1. No email on user account   → action: attach_email
  2. No fio/location            → action: update_profile
  3a. employer                  → action: create_project
  3b. worker                    → action: update_profile (specialization)
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
    _GENAI_OK = True
except Exception as _e:
    genai = None            # type: ignore
    genai_types = None      # type: ignore
    _GENAI_OK = False
    logger.info("google-genai not installed (%s) — Ollama only.", _e)


class LLMService:
    """Gemini → Ollama fallback orchestrator."""

    def __init__(self) -> None:
        import os
        os.environ.setdefault("OLLAMA_HOST", settings.ollama_host)

        self._gemini: Optional[object] = None
        api_key = settings.google_api_key_or_none
        if _GENAI_OK and api_key:
            try:
                self._gemini = genai.Client(api_key=api_key)  # type: ignore
                logger.info("✅ Gemini ready (model=%s)", settings.gemini_model)
            except Exception as exc:
                logger.warning("⚠️ Gemini init failed: %s", exc)
        else:
            logger.info("ℹ️ Gemini disabled — using Ollama (%s)", settings.ollama_model)

    # ── Public ────────────────────────────────────────────────

    async def generate_response(
        self,
        messages: list,
        current_user=None,
    ) -> Tuple[str, Optional[dict]]:
        system = self._build_system_prompt(current_user)

        if self._gemini:
            try:
                return self._gemini_call(messages, system)
            except Exception as exc:
                logger.warning("⚠️ Gemini error (%s) — fallback to Ollama", exc)

        try:
            return self._ollama_call(messages, system)
        except Exception as exc:
            logger.error("❌ LLM critical failure: %s", exc)
            return (
                "Извините, наш ассистент сейчас недоступен. Попробуйте позже.",
                None,
            )

    # ── System prompt builder ──────────────────────────────────

    def _build_system_prompt(self, user) -> str:  # noqa: C901
        base = (
            "ТЫ ОБЯЗАН ОТВЕЧАТЬ ТОЛЬКО В ФОРМАТЕ JSON. НИКОГДА НЕ ОТСТУПАЙ.\n"
            "Структура ответа (JSON object):\n"
            "{\n"
            '  "thought_process": "<твои внутренние рассуждения>",\n'
            '  "message": "<вежливый текст пользователю, без служебных символов>",\n'
            '  "extracted_data": null  // null если данных ещё недостаточно\n'
            "}\n"
            "Когда цель выполнена на 100%, заполни extracted_data:\n"
            '{"action": "<действие>", "data": {<параметры>}}\n\n'
        )

        profile = getattr(user, "profile", None) if user else None
        role    = profile.role if profile else None

        # Phase 0: no account yet
        if not user or not profile or role is None or role.value == "unknown":
            return base + (
                "ФАЗА 0 — Определение роли.\n"
                "ЦЕЛЬ: выяснить два параметра:\n"
                "  - role: 'worker' (ищет заработок) ИЛИ 'employer' (ищет специалиста)\n"
                "  - entity_type: 'physical' (физлицо) ИЛИ 'legal' (организация)\n"
                'Пример extracted_data: {"action": "set_role", "data": {"role": "worker", "entity_type": "physical"}}\n'
                "НЕ заполняй extracted_data, пока не узнал ОБА параметра."
            )

        # Phase 1: email not yet attached
        if not getattr(user, "email", None):
            return base + (
                "ФАЗА 1 — Учётные данные.\n"
                "ЦЕЛЬ: узнать email-адрес и пароль.\n"
                "Правила:\n"
                "  - Email должен содержать @ и домен.\n"
                "  - Пароль от 6 до 128 символов.\n"
                "  - Сначала спроси email, затем пароль.\n"
                '  - Попроси подтверждение пароля.\n'
                'Пример extracted_data: {"action": "attach_email", "data": {"email": "user@mail.ru", "password": "pass123"}}\n'
                "НЕ заполняй extracted_data, пока не получен и email и пароль."
            )

        # Phase 2: fio/location missing
        if not profile.fio or not profile.location:
            return base + (
                "ФАЗА 2 — Верификация.\n"
                "ЦЕЛЬ: узнать ФИО (полное имя) и Город работы.\n"
                'Пример extracted_data: {"action": "update_profile", "data": {"fio": "Иван Петров", "location": "Москва"}}\n'
                "НЕ заполняй extracted_data, пока не получены ОБА параметра."
            )

        # Phase 3a: employer — create project
        if role.value == "employer":
            return base + (
                "ФАЗА 3 — Техническое задание.\n"
                "ЦЕЛЬ: собрать суть задачи, требуемую специализацию, бюджет (число).\n"
                'Пример extracted_data: {"action": "create_project", "data": {"title": "Ремонт квартиры", "description": "ТЗ...", "budget": 80000, "required_specialization": "плиточник"}}\n'
                "НЕ заполняй extracted_data, пока не узнал все поля."
            )

        # Phase 3b: worker — collect specialization
        return base + (
            "ФАЗА 3 — Портфолио.\n"
            "ЦЕЛЬ: узнать специализацию и опыт работника.\n"
            'Пример extracted_data: {"action": "update_profile", "data": {"specialization": "плиточник", "experience_years": 5}}\n'
            "НЕ заполняй extracted_data, пока не получена специализация."
        )

    # ── LLM backends ────────────────────────────────────────────

    def _gemini_call(self, messages: list, system: str) -> Tuple[str, Optional[dict]]:
        contents = []
        for m in messages:
            if m.role == "system":
                continue
            role = "user" if m.role == "user" else "model"
            contents.append(
                genai_types.Content(  # type: ignore
                    role=role,
                    parts=[genai_types.Part.from_text(text=m.content)],  # type: ignore
                )
            )
        resp = self._gemini.models.generate_content(  # type: ignore
            model=settings.gemini_model,
            contents=contents,
            config=genai_types.GenerateContentConfig(  # type: ignore
                system_instruction=system,
                response_mime_type="application/json",
            ),
        )
        return _parse_json(resp.text, "GEMINI")

    def _ollama_call(self, messages: list, system: str) -> Tuple[str, Optional[dict]]:
        history = [{"role": "system", "content": system}]
        for m in messages:
            history.append({"role": m.role, "content": m.content})
        resp = ollama.chat(
            model=settings.ollama_model,
            messages=history,
            format="json",
        )
        return _parse_json(resp["message"]["content"], "OLLAMA")


# ── Module-level JSON parser ─────────────────────────────────

def _parse_json(raw: str, engine: str) -> Tuple[str, Optional[dict]]:
    try:
        data = json.loads(raw)
    except Exception:
        # Model returned plain text instead of JSON — surface it gracefully
        logger.warning("%s returned non-JSON: %s", engine, raw[:200])
        return raw.strip() or "Повторите пожалуйста.", None

    thought = data.get("thought_process", "")
    if thought:
        logger.debug("⚡ %s THOUGHT: %s", engine, thought)

    message = data.get("message", "").strip()
    if not message:
        message = "Обрабатываю..."

    extracted = data.get("extracted_data")
    if not extracted or not isinstance(extracted, dict):
        return message, None

    action = extracted.get("action")
    payload = extracted.get("data", {})
    if not action:
        return message, None

    return message, {"action": action, "data": payload}
