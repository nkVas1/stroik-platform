"""
Centralized application settings powered by pydantic-settings.

All secrets, API keys, database URLs and CORS configuration live here and are
loaded from environment variables (or a local `.env` file). This is the single
source of truth — no module should hardcode secrets ever again.

Phase 5 — Stabilization & Security.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve the backend/ directory so that .env is found regardless of CWD.
BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # ── Server ───────────────────────────────────────────────────────────
    debug: bool = Field(default=True, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    api_host: str = Field(default="127.0.0.1", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")

    # ── Database ─────────────────────────────────────────────────────────
    # Default: local SQLite. Production should set DATABASE_URL=postgresql+asyncpg://...
    database_url: str = Field(
        default="sqlite+aiosqlite:///./stroik.db",
        alias="DATABASE_URL",
    )

    # ── Security / JWT ───────────────────────────────────────────────────
    secret_key: str = Field(
        default="dev-only-secret-key-CHANGE-ME-in-production",
        alias="SECRET_KEY",
    )
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60 * 24 * 7,  # 7 days
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    # ── LLM ──────────────────────────────────────────────────────────────
    # Primary cloud model (free tier). Optional — if unset, only Llama3 is used.
    google_api_key: Optional[str] = Field(default=None, alias="GOOGLE_API_KEY")
    gemini_model: str = Field(
        default="gemini-1.5-flash",  # стабильная общедоступная модель
        alias="GEMINI_MODEL",
    )

    # Local Ollama fallback
    ollama_model: str = Field(default="llama3", alias="OLLAMA_MODEL")
    ollama_host: str = Field(
        default="http://127.0.0.1:11434",
        alias="OLLAMA_HOST",
    )

    # ── CORS ─────────────────────────────────────────────────────────────
    # Comma-separated list in env: CORS_ORIGINS=http://localhost:3000,https://stroik.app
    cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        alias="CORS_ORIGINS",
    )

    # ── Uploads ──────────────────────────────────────────────────────────
    uploads_dir: Path = Field(
        default=BACKEND_DIR / "uploads",
        alias="UPLOADS_DIR",
    )

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Validators ───────────────────────────────────────────────────────
    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, value):
        """Allow CORS_ORIGINS to come as a comma-separated string."""
        if isinstance(value, str):
            # Strip JSON-array brackets if user wrote them
            v = value.strip()
            if v.startswith("[") and v.endswith("]"):
                v = v[1:-1]
            return [origin.strip().strip('"').strip("'") for origin in v.split(",") if origin.strip()]
        return value

    @field_validator("uploads_dir", mode="after")
    @classmethod
    def _ensure_uploads_dir(cls, value: Path) -> Path:
        value.mkdir(parents=True, exist_ok=True)
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance (process-wide singleton)."""
    return Settings()


# Convenience module-level instance for plain imports.
settings = get_settings()
