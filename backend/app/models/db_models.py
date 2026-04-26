"""
SQLAlchemy модели для основных сущностей платформы.
"""

from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    """Роль пользователя на платформе."""
    WORKER = "worker"       # Ищет работу (бригада/одиночка)
    EMPLOYER = "employer"   # Ищет исполнителей (заказчик)
    UNKNOWN = "unknown"     # Еще не определился на этапе онбординга


class User(Base):
    """Таблица пользователей (аутентификация и идентификация)."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=True)  # Для Госуслуг/СМС
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Profile(Base):
    """Таблица профилей (бизнес-данные, собранные ИИ)."""
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    role = Column(Enum(UserRole), default=UserRole.UNKNOWN)
    specialization = Column(String, nullable=True)  # Например: "Плиточник", "Электрик"
    experience_years = Column(Integer, nullable=True)
    raw_data = Column(JSON, nullable=True)  # Гибкое поле для доп. данных от ИИ
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")
