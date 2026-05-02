"""
Централизованные настройки приложения.
Phase 10 — исправлен парсинг CORS_ORIGINS и GOOGLE_API_KEY для любых версий pydantic-settings.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # Сервер
    debug: bool = Field(default=True, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    api_host: str = Field(default="127.0.0.1", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")

    # База данных
    database_url: str = Field(
        default="sqlite+aiosqlite:///./stroik.db",
        alias="DATABASE_URL",
    )

    # JWT
    secret_key: str = Field(
        default="dev-only-secret-key-CHANGE-ME-in-production",
        alias="SECRET_KEY",
    )
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60 * 24 * 7,
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    # LLM — str (не Optional[str]!) — так pydantic-settings не пытается декодировать пустую строку как JSON
    google_api_key: str = Field(default="", alias="GOOGLE_API_KEY")
    gemini_model: str = Field(default="gemini-1.5-flash", alias="GEMINI_MODEL")
    ollama_model: str = Field(default="qwen2.5:7b", alias="OLLAMA_MODEL")
    ollama_host: str = Field(default="http://127.0.0.1:11434", alias="OLLAMA_HOST")

    # CORS — храним как str, разбиваем в проперти
    # Это избегает баг pydantic-settings, который пытается json.loads() до field_validator для List[str]
    cors_origins_raw: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="CORS_ORIGINS",
    )

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

    @field_validator("uploads_dir", mode="after")
    @classmethod
    def _ensure_uploads_dir(cls, value: Path) -> Path:
        value.mkdir(parents=True, exist_ok=True)
        return value

    @property
    def cors_origins(self) -> List[str]:
        """CORS_ORIGINS как список. Принимает запятую строку или JSON-массив."""
        v = self.cors_origins_raw.strip()
        if not v:
            return ["http://localhost:3000"]
        if v.startswith("["):
            # убираем ["] и разбиваем
            v = v.strip("[]").replace('"', "").replace("'", "")
        return [o.strip() for o in v.split(",") if o.strip()]

    @property
    def google_api_key_or_none(self) -> Optional[str]:
        """None если ключ пуст или не установлен."""
        return self.google_api_key.strip() or None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
