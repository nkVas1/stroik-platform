"""
Hybrid LLM service for the СТРОИК AI assistant.

Strategy
========
1. **Primary**: Google Gemini (free tier) when `GOOGLE_API_KEY` is set.
2. **Fallback**: local Llama3 served by Ollama. Always available offline,
   zero recurring cost — fully aligned with the project's sovereignty rules.

Both engines are forced to return strict JSON via their respective
"JSON-only" output modes, eliminating the need for fragile regex parsing.

Phase 5: secrets and model names are now read from `app.core.config.settings`.
The legacy `🔴 КРИТИЧЕСКИ ВАЖНО` defensive markers are preserved.
"""

from __future__ import annotations

import json
import logging
from typing import Optional, Tuple

import ollama

from app.core.config import settings

logger = logging.getLogger(__name__)

# Optional Gemini import — the dependency is only required when GOOGLE_API_KEY
# is configured. We keep the import lazy/guarded so that local-only setups
# (Llama3 only) work without `google-genai` installed.
try:  # pragma: no cover - import-time side effect
    from google import genai  # type: ignore
    from google.genai import types as genai_types  # type: ignore

    _GENAI_AVAILABLE = True
except Exception as _gen_import_err:  # noqa: BLE001
    genai = None  # type: ignore
    genai_types = None  # type: ignore
    _GENAI_AVAILABLE = False
    logger.info(
        "google-genai SDK не установлен (%s). Будет использоваться только локальная Llama3.",
        _gen_import_err,
    )


class LLMService:
    """High-level LLM orchestration with seamless Gemini → Llama3 fallback."""

    def __init__(self) -> None:
        # 🔴 КРИТИЧЕСКИ ВАЖНО: Гибридная конфигурация (Primary + Fallback)
        self.primary_model = settings.gemini_model
        self.fallback_model = settings.ollama_model

        # Gemini client is created lazily — only if both SDK and key are present.
        self._gemini_client: Optional[object] = None
        if _GENAI_AVAILABLE and settings.google_api_key:
            try:
                self._gemini_client = genai.Client(api_key=settings.google_api_key)  # type: ignore[union-attr]
                logger.info("✅ Gemini клиент инициализирован (model=%s)", self.primary_model)
            except Exception as exc:  # noqa: BLE001
                logger.warning("⚠️ Не удалось инициализировать Gemini-клиент: %s", exc)
                self._gemini_client = None
        else:
            logger.info("ℹ️ Gemini отключён (нет ключа или SDK). Работаем только на Llama3.")

        # Configure Ollama host once.
        # The python `ollama` library reads `OLLAMA_HOST` env var automatically,
        # but we set it explicitly for clarity.
        import os
        os.environ.setdefault("OLLAMA_HOST", settings.ollama_host)

    # ── Prompt engineering (State Machine) ──────────────────────────────
    def _get_system_instruction(self, user) -> str:  # noqa: ANN001
        """Compose a minimal, focused prompt depending on user state."""
        base_rules = (
            "ТЫ ОБЯЗАН ОТВЕЧАТЬ СТРОГО В ФОРМАТЕ JSON.\n"
            "Структура ответа:\n"
            "{\n"
            '  "thought_process": "Твои рассуждения. Проверь чек-лист.",\n'
            '  "message": "Твой вежливый ответ пользователю в чат (1 вопрос).",\n'
            '  "extracted_data": {"action": "...", "data": {...}} // ЗАПОЛНЯТЬ ТОЛЬКО ПРИ 100% ВЫПОЛНЕНИИ ЦЕЛИ\n'
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
                'Если узнал оба параметра, верни: {"action": "update_profile", "data": {"fio": "Иван Иванов", "location": "Москва", "verification_level": 1}}'
            )

        if user.profile.role.value == "employer":
            return base_rules + (
                "ФАЗА: Создание ТЗ.\n"
                "ЦЕЛЬ: Узнать Суть задачи (описание) и Бюджет (число).\n"
                'Если данные собраны, верни: {"action": "create_project", "data": {"title": "Название", "description": "ТЗ", "budget": 50000, "required_specialization": "специальность"}}'
            )

        return base_rules + (
            "ФАЗА: Портфолио специалиста.\n"
            'Спрашивай про навыки. Если называет, верни: {"action": "update_profile", "data": {"specialization": "новые навыки"}}'
        )

    # ── Public API ──────────────────────────────────────────────────────
    async def generate_response(
        self,
        messages: list,
        current_user=None,  # noqa: ANN001
    ) -> Tuple[str, Optional[dict]]:
        """Run the inference pipeline with primary→fallback semantics."""
        system_instruction = self._get_system_instruction(current_user)

        # 🔴 КРИТИЧЕСКИ ВАЖНО: Попытка 1 — Gemini (Primary)
        if self._gemini_client is not None:
            try:
                return self._call_gemini(messages, system_instruction)
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "⚠️ Отказ Gemini (%s). Бесшовный переход на локальную Llama3...", exc
                )

        # 🔴 КРИТИЧЕСКИ ВАЖНО: Попытка 2 — Ollama (Fallback) / основной режим если Gemini нет
        try:
            return self._call_ollama(messages, system_instruction)
        except Exception as exc:  # noqa: BLE001
            logger.error("❌ Критический сбой LLM-систем: %s", exc)
            return (
                "Извините, ИИ-ассистент сейчас недоступен. Вы можете заполнить профиль вручную в личном кабинете.",
                None,
            )

    # ── Private helpers ────────────────────────────────────────────────
    def _call_gemini(self, messages: list, system_instruction: str) -> Tuple[str, Optional[dict]]:
        """Invoke Google Gemini via the new google-genai SDK."""
        gemini_messages = []
        for msg in messages:
            if msg.role == "system":
                continue
            role = "user" if msg.role == "user" else "model"
            gemini_messages.append(
                genai_types.Content(  # type: ignore[union-attr]
                    role=role,
                    parts=[genai_types.Part.from_text(text=msg.content)],  # type: ignore[union-attr]
                )
            )

        response = self._gemini_client.models.generate_content(  # type: ignore[union-attr]
            model=self.primary_model,
            contents=gemini_messages,
            config=genai_types.GenerateContentConfig(  # type: ignore[union-attr]
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ),
        )
        return self._parse_llm_json(response.text, "GEMINI")

    def _call_ollama(self, messages: list, system_instruction: str) -> Tuple[str, Optional[dict]]:
        """Invoke a local Ollama-served model with `format='json'`."""
        clean_messages = [{"role": "system", "content": system_instruction}]
        for msg in messages:
            clean_messages.append({"role": msg.role, "content": msg.content})

        response_ollama = ollama.chat(
            model=self.fallback_model,
            messages=clean_messages,
            format="json",
        )
        return self._parse_llm_json(response_ollama["message"]["content"], "LLAMA3")

    @staticmethod
    def _parse_llm_json(raw_content: str, engine_name: str) -> Tuple[str, Optional[dict]]:
        """Parse the strict-JSON LLM response into (reply_text, extracted_data)."""
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
        except Exception as exc:  # noqa: BLE001
            logger.error("Ошибка парсинга JSON от %s: %s", engine_name, exc)
            return "Я немного запутался в форматах, повторите пожалуйста.", None
