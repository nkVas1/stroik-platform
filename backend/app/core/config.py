"""
Централизованные настройки приложения на pydantic-settings.

Все секреты, API-ключи, URL базы данных и CORS-настройки живут здесь и
загружаются из переменных окружения (или из локального .env). Это единый
источник правды — ни один модуль не должен хардкодить секреты.

Phase 5 — Стабилизация и безопасность.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# ── NoDecode -----------------------------------------------------------------
# Аннотация NoDecode говорит pydantic-settings: «не пытайся декодировать это
# поле как JSON». Без неё List[str] обрабатывается как JSON-массив, и значение
# вида "http://a.com,http://b.com" в .env вызывает json.JSONDecodeError ДО
# того, как сработает наш field_validator, который умеет разрезать строку
# по запятой.
# NoDecode появился в pydantic-settings 2.2. Если у пользователя более старая
# версия — делаем «тихий» фоллбэк: NoDecode становится no-op-аннотацией, а
# CORS-список всё равно корректно собирается через property cors_origins_list.
try:
    from pydantic_settings import NoDecode  # type: ignore
except ImportError:  # pragma: no cover — старая версия pydantic-settings
    NoDecode = None  # type: ignore


from typing import Annotated  # ставим после try-блока, чтобы NoDecode уже был

# Корень backend/, чтобы .env находился независимо от текущей рабочей директории
BACKEND_DIR = Path(__file__).resolve().parents[2]


# Тип CORS-поля выбираем динамически: с NoDecode при наличии, без — иначе.
if NoDecode is not None:
    _CORSField = Annotated[List[str], NoDecode]
else:
    _CORSField = List[str]  # type: ignore[misc]


class Settings(BaseSettings):
    """Конфигурация приложения, читается из переменных окружения."""

    # ── Сервер ───────────────────────────────────────────────────────────
    debug: bool = Field(default=True, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    api_host: str = Field(default="127.0.0.1", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")

    # ── База данных ──────────────────────────────────────────────────────
    # По умолчанию — локальный SQLite. Production: DATABASE_URL=postgresql+asyncpg://...
    database_url: str = Field(
        default="sqlite+aiosqlite:///./stroik.db",
        alias="DATABASE_URL",
    )

    # ── Безопасность / JWT ───────────────────────────────────────────────
    secret_key: str = Field(
        default="dev-only-secret-key-CHANGE-ME-in-production",
        alias="SECRET_KEY",
    )
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60 * 24 * 7,  # 7 дней
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    # ── LLM ──────────────────────────────────────────────────────────────
    # Если ключ пуст — Gemini не используется, всё работает на локальной Llama3.
    google_api_key: Optional[str] = Field(default=None, alias="GOOGLE_API_KEY")
    gemini_model: str = Field(
        default="gemini-1.5-flash",  # стабильная общедоступная модель
        alias="GEMINI_MODEL",
    )

    # Локальная LLM (Ollama)
    ollama_model: str = Field(default="llama3", alias="OLLAMA_MODEL")
    ollama_host: str = Field(
        default="http://127.0.0.1:11434",
        alias="OLLAMA_HOST",
    )

    # ── CORS ─────────────────────────────────────────────────────────────
    # Список через запятую в .env:
    #   CORS_ORIGINS=http://localhost:3000,https://stroik.app
    # JSON-массив тоже принимается:
    #   CORS_ORIGINS=["http://localhost:3000","https://stroik.app"]
    cors_origins: _CORSField = Field(  # type: ignore[valid-type]
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        alias="CORS_ORIGINS",
    )

    # ── Загрузки ─────────────────────────────────────────────────────────
    uploads_dir: Path = Field(
        default=BACKEND_DIR / "uploads",
        alias="UPLOADS_DIR",
    )

    # ── Конфигурация pydantic-settings ───────────────────────────────────
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Валидаторы ───────────────────────────────────────────────────────
    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, value):
        """Принять CORS_ORIGINS как строку через запятую или JSON-массив.

        В паре с NoDecode выше это даёт максимально терпимый парсинг:
          • "a,b,c"               → ["a", "b", "c"]
          • '["a","b","c"]'       → ["a", "b", "c"]
          • ["a", "b"]  (уже list)→ ["a", "b"]
          • ""                    → []
        """
        if value is None:
            return []
        if isinstance(value, str):
            v = value.strip()
            if not v:
                return []
            # Поддержка JSON-формата (если кто-то всё-таки написал [...])
            if v.startswith("[") and v.endswith("]"):
                v = v[1:-1]
            return [
                origin.strip().strip('"').strip("'")
                for origin in v.split(",")
                if origin.strip()
            ]
        return value

    @field_validator("uploads_dir", mode="after")
    @classmethod
    def _ensure_uploads_dir(cls, value: Path) -> Path:
        value.mkdir(parents=True, exist_ok=True)
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Кэшированный singleton настроек на весь процесс."""
    return Settings()


# Удобный модульный экземпляр для прямых импортов: `from app.core.config import settings`
settings = get_settings()
