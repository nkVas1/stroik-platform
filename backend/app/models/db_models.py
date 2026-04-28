import enum
from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, Enum as SQLEnum, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class UserRole(str, enum.Enum):
    """Роль пользователя на платформе."""
    WORKER = "worker"       # Ищет работу (бригада/одиночка)
    EMPLOYER = "employer"   # Ищет исполнителей (заказчик)
    UNKNOWN = "unknown"     # Еще не определился на этапе онбординга


class EntityType(str, enum.Enum):
    """Тип юридического лица."""
    PHYSICAL = "physical"   # Физическое лицо (ИП, наемный рабочий)
    LEGAL = "legal"         # Юридическое лицо (компания)
    UNKNOWN = "unknown"     # Еще не определено


class VerificationLevel(int, enum.Enum):
    """Уровни верификации пользователя."""
    NONE = 0       # Только роль (базовый онбординг)
    BASIC = 1      # ФИО + Локация
    CONTACTS = 2   # Email + Телефон
    PASSPORT = 3   # Паспортные данные / Госуслуги


class ProjectStatus(str, enum.Enum):
    """Статусы проекта (заказа)."""
    OPEN = "open"                 # Открыт для откликов
    IN_PROGRESS = "in_progress"   # В работе
    COMPLETED = "completed"       # Завершен
    CANCELLED = "cancelled"       # Отменен


class BidStatus(str, enum.Enum):
    """Статусы отклика на проект."""
    PENDING = "pending"   # Ожидает решения заказчика
    ACCEPTED = "accepted" # Заказчик выбрал этого рабочего (старт сделки)
    REJECTED = "rejected" # Отказ


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
    role = Column(SQLEnum(UserRole), default=UserRole.UNKNOWN)
    
    # Уровень верификации и бизнес-статус
    verification_level = Column(SQLEnum(VerificationLevel), default=VerificationLevel.NONE)
    entity_type = Column(SQLEnum(EntityType), default=EntityType.UNKNOWN)  # Физ/юр лицо
    company_name = Column(String, nullable=True)  # Для юридических лиц
    
    # Данные верификации (Уровень 1: BASIC)
    fio = Column(String, nullable=True)           # Фамилия Имя Отчество
    location = Column(String, nullable=True)      # Город, регион
    
    # Данные верификации (Уровень 2: CONTACTS)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)         # Резервное поле для номера профиля
    
    # Легальные фильтры (замена национальности)
    language_proficiency = Column(String, nullable=True)  # "Базовый", "Разговорный", "Свободный"
    work_authorization = Column(String, nullable=True)    # "Гражданство РФ", "Патент", "ВНЖ"
    
    # Профессиональные данные
    specialization = Column(String, nullable=True)  # Например: "Плиточник", "Электрик"
    experience_years = Column(Integer, nullable=True)
    project_scope = Column(String, nullable=True)   # Описание задачи/объекта для заказчиков
    
    raw_data = Column(JSON, nullable=True)  # Гибкое поле для доп. данных от ИИ
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")


class Project(Base):
    """Таблица проектов (заказов от заказчиков)."""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)          # Краткое название заказа
    description = Column(Text, nullable=False)      # Подробное техническое задание (ТЗ)
    budget = Column(Integer, nullable=True)         # Бюджет в рублях
    required_specialization = Column(String, nullable=True)  # Кого ищем (специальность)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.OPEN)  # Статус заказа
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связь: один заказчик -> много проектов
    employer = relationship("User", backref="projects")


class BidStatus(str, enum.Enum):
    """Статусы отклика на проект."""
    PENDING = "pending"   # Ожидает решения заказчика
    ACCEPTED = "accepted" # Заказчик выбрал этого рабочего (старт сделки)
    REJECTED = "rejected" # Отказ


class Bid(Base):
    """Таблица откликов рабочих на проекты."""
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    # Рабочий может предложить свою цену и сопроводительное письмо
    cover_letter = Column(String, nullable=True) 
    price_offer = Column(Integer, nullable=True) 
    
    status = Column(SQLEnum(BidStatus), default=BidStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи для быстрого доступа
    project = relationship("Project", backref="bids")
    worker = relationship("User", backref="bids")
