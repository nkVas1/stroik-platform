"""
Hybrid LLM service — Gemini primary, Ollama fallback.

Onboarding state machine phases:
  Phase 0  — No account yet         → ask role + entity_type
                                       action: set_role
  Phase 1  — No email on account    → ask email + password
                                       action: attach_email  (handled by /api/auth/attach-email)
  Phase 2  — No FIO / location      → ask FIO + city
                                       action: update_profile
  Phase 3a — Employer, no projects  → collect project brief
                                       action: create_project
  Phase 3b — Worker, ask skills     → collect specialization
                                       action: update_profile
  Phase 4  — All data collected     → congratulate
                                       action: complete_onboarding
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
except Exception as _err:
    genai = None  # type: ignore
    genai_types = None  # type: ignore
    _GENAI_AVAILABLE = False
    logger.info("google-genai SDK not installed (%s). Using Ollama only.", _err)


class LLMService:
    """Orchestrates Gemini/Ollama with a structured onboarding state machine."""

    def __init__(self) -> None:
        self.primary_model = settings.gemini_model
        self.fallback_model = settings.ollama_model
        self._gemini_client: Optional[object] = None

        api_key = settings.google_api_key_or_none
        if _GENAI_AVAILABLE and api_key:
            try:
                self._gemini_client = genai.Client(api_key=api_key)  # type: ignore
                logger.info("✅ Gemini client ready (model=%s)", self.primary_model)
            except Exception as exc:
                logger.warning("⚠️ Gemini init failed: %s", exc)
        else:
            logger.info("ℹ️ Gemini disabled — using Ollama only.")

        import os
        os.environ.setdefault("OLLAMA_HOST", settings.ollama_host)

    # ------------------------------------------------------------------ #
    #  State machine: pick the right system prompt based on user state     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _phase(user) -> str:
        """
        Return the current onboarding phase label for the given user.
        user can be None (unauthenticated guest).
        """
        if user is None:
            return "phase_0_role"

        profile = getattr(user, "profile", None)

        if profile is None or profile.role.value == "unknown":
            return "phase_0_role"

        if not user.email:
            return "phase_1_email"

        # VerificationLevel is IntEnum; .value is int 0..3
        vlevel = profile.verification_level.value if profile.verification_level is not None else 0
        if vlevel < 1:
            return "phase_2_verify"

        if profile.role.value == "employer":
            return "phase_3a_project"

        # worker: check if specialization set
        if not profile.specialization:
            return "phase_3b_skills"

        return "phase_4_done"

    def _get_system_instruction(self, user) -> str:
        phase = self._phase(user)

        base = (
            "You are the СТРОИК AI assistant. ALWAYS respond in Russian. "
            "ALWAYS respond with valid JSON only — no markdown, no code blocks.\n"
            "Response schema:\n"
            "{\n"
            '  "thought_process": "<your reasoning, max 2 sentences>",\n'
            '  "message": "<your friendly reply to the user, plain text>",\n'
            '  "extracted_data": {"action": "<action_name>", "data": {...}}  '
            "// ONLY include when you have ALL required data for the current phase\n"
            "}\n"
            "Rules:\n"
            "- Never fabricate data the user did not provide.\n"
            "- If a piece of data is missing, keep asking, do NOT fill extracted_data.\n"
            "- Be concise, warm, professional.\n\n"
        )

        phases = {
            "phase_0_role": (
                "PHASE 0 — Role selection.\n"
                "Goal: determine role ('worker' or 'employer') AND entity_type ('physical' or 'legal').\n"
                "- If user names a trade/profession (plumber, electrician, etc.) → role=worker.\n"
                "- If user wants to hire/find workers → role=employer.\n"
                "- Individual person → entity_type=physical. Company/LLC/IP → entity_type=legal.\n"
                "- Ask follow-up questions until you have BOTH values.\n"
                "When you have both, return:\n"
                '{"action": "set_role", "data": {"role": "worker", "entity_type": "physical"}}'
            ),
            "phase_1_email": (
                "PHASE 1 — Account credentials.\n"
                "Goal: collect a valid email address and a password (min 6 chars).\n"
                "- First ask for email, then password, then confirm password.\n"
                "- Validate: email must contain '@'. Password min 6 chars.\n"
                "- Do NOT proceed if passwords don't match.\n"
                "When both are collected and confirmed, return:\n"
                '{"action": "attach_email", "data": {"email": "user@example.com", "password": "secret123"}}'
            ),
            "phase_2_verify": (
                "PHASE 2 — Identity verification.\n"
                "Goal: collect full name (FIO) and city.\n"
                "When you have both, return:\n"
                '{"action": "update_profile", "data": {"fio": "Иван Иванов", "location": "Москва", "verification_level": 1}}'
            ),
            "phase_3a_project": (
                "PHASE 3A — First project brief (employer).\n"
                "Goal: collect project title, description, budget (number), required specialization.\n"
                "When all 4 fields collected, return:\n"
                '{"action": "create_project", "data": {"title": "Title", "description": "...", "budget": 50000, "required_specialization": "electrician"}}\n'
                "After creating the project, immediately send a second action:\n"
                '{"action": "complete_onboarding", "data": {}}'
            ),
            "phase_3b_skills": (
                "PHASE 3B — Worker skills.\n"
                "Goal: collect main specialization (1-3 words, e.g. 'электрик').\n"
                "When collected, return:\n"
                '{"action": "update_profile", "data": {"specialization": "электрик"}}\n'
                "Then immediately send:\n"
                '{"action": "complete_onboarding", "data": {}}'
            ),
            "phase_4_done": (
                "PHASE 4 — Onboarding complete.\n"
                "Congratulate the user warmly and tell them their profile is ready.\n"
                "Return: {\"action\": \"complete_onboarding\", \"data\": {}}"
            ),
        }

        return base + phases.get(phase, phases["phase_0_role"])

    # ------------------------------------------------------------------ #
    #  Public API                                                          #
    # ------------------------------------------------------------------ #

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
                logger.warning("⚠️ Gemini error (%s) — falling back to Ollama.", exc)

        try:
            return self._call_ollama(messages, system_instruction)
        except Exception as exc:
            logger.error("❌ Critical LLM failure: %s", exc)
            return (
                "Извините, ассистент временно недоступен. Попробуйте ещё раз.",
                None,
            )

    # ------------------------------------------------------------------ #
    #  Private helpers                                                     #
    # ------------------------------------------------------------------ #

    def _call_gemini(self, messages: list, system_instruction: str) -> Tuple[str, Optional[dict]]:
        gemini_messages = []
        for msg in messages:
            if msg.role == "system":
                continue
            role = "user" if msg.role == "user" else "model"
            gemini_messages.append(
                genai_types.Content(  # type: ignore
                    role=role,
                    parts=[genai_types.Part.from_text(text=msg.content)],  # type: ignore
                )
            )
        response = self._gemini_client.models.generate_content(  # type: ignore
            model=self.primary_model,
            contents=gemini_messages,
            config=genai_types.GenerateContentConfig(  # type: ignore
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ),
        )
        return self._parse_llm_json(response.text, "GEMINI")

    def _call_ollama(self, messages: list, system_instruction: str) -> Tuple[str, Optional[dict]]:
        clean_messages = [{"role": "system", "content": system_instruction}]
        for msg in messages:
            clean_messages.append({"role": msg.role, "content": msg.content})
        resp = ollama.chat(
            model=self.fallback_model,
            messages=clean_messages,
            format="json",
        )
        return self._parse_llm_json(resp["message"]["content"], "OLLAMA")

    @staticmethod
    def _parse_llm_json(raw: str, engine: str) -> Tuple[str, Optional[dict]]:
        try:
            data = json.loads(raw)
            thought = data.get("thought_process", "")
            if thought:
                logger.debug("⚡ %s thought: %s", engine, thought)
            message = data.get("message", "Обрабатываю...")
            extracted = data.get("extracted_data")
            if extracted and isinstance(extracted, dict) and extracted.get("action"):
                return message, {
                    "action": extracted["action"],
                    "data": extracted.get("data", {}),
                }
            return message, None
        except Exception as exc:
            logger.error("❌ %s JSON parse error: %s | raw=%r", engine, exc, raw[:200])
            return "Повторите пожалуйста, произошла ошибка.", None
