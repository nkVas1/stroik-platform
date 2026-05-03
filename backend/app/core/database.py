"""
Async database engine factory.

Supports two drivers:
  - SQLite  (local dev): sqlite+aiosqlite:///./stroik.db
  - PostgreSQL (Render):  postgresql+asyncpg://... OR the plain
    postgresql:// URL that Render injects — we auto-rewrite the scheme.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings


def _resolve_db_url(url: str) -> str:
    """
    Render injects DATABASE_URL as  postgresql://user:pass@host/db
    SQLAlchemy async requires     postgresql+asyncpg://user:pass@host/db
    This helper normalises the URL transparently.
    """
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        # older Render / Heroku shorthand
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


_db_url = _resolve_db_url(settings.database_url)

# SQLite needs check_same_thread=False; asyncpg ignores it.
_connect_args = {"check_same_thread": False} if _db_url.startswith("sqlite") else {}

engine = create_async_engine(
    _db_url,
    echo=False,
    future=True,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a fresh async session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
