"""
Асинхронное подключение к SQLite для локальной разработки.
SQLite встроена в Python, не требует Docker и идеально подходит для Phase 1.
При деплое просто поменяем URL на PostgreSQL.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

# Асинхронный SQLite - локальный файл stroik.db в корне backend
DATABASE_URL = "sqlite+aiosqlite:///./stroik.db"

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency для получения сессии БД в эндпоинтах FastAPI."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

