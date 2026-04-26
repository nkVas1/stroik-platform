"""
Конфигурация асинхронного подключения к PostgreSQL через SQLAlchemy.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

# В идеале URL должен браться из .env файла (Pydantic BaseSettings), 
# но для старта хардкодим локальный адрес нашего Docker-контейнера.
DATABASE_URL = "postgresql+asyncpg://stroik:stroik_password@localhost:5432/stroik_db"

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
