import enum
from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, Enum as SQLEnum, DateTime, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class UserRole(str, enum.Enum):
    WORKER = "worker"
    EMPLOYER = "employer"
    UNKNOWN = "unknown"


class EntityType(str, enum.Enum):
    PHYSICAL = "physical"
    LEGAL = "legal"
    UNKNOWN = "unknown"


class VerificationLevel(int, enum.Enum):
    NONE = 0
    BASIC = 1
    CONTACTS = 2
    PASSPORT = 3


class ProjectStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BidStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    role = Column(SQLEnum(UserRole), default=UserRole.UNKNOWN)
    verification_level = Column(SQLEnum(VerificationLevel), default=VerificationLevel.NONE)
    entity_type = Column(SQLEnum(EntityType), default=EntityType.UNKNOWN)
    company_name = Column(String, nullable=True)

    fio = Column(String, nullable=True)
    location = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    language_proficiency = Column(String, nullable=True)
    work_authorization = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    project_scope = Column(String, nullable=True)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    budget = Column(Integer, nullable=True)
    required_specialization = Column(String, nullable=True)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.OPEN)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employer = relationship("User", backref="projects")


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    cover_letter = Column(String, nullable=True)
    price_offer = Column(Integer, nullable=True)
    status = Column(SQLEnum(BidStatus), default=BidStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", backref="bids")
    worker = relationship("User", backref="bids")


class Review(Base):
    """Отзыв заказчика о специалисте после завершения проекта.
    Каждый отзыв привязан к конкретному проекту — без накруток.
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), unique=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))   # Заказчик
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))     # Кого оценивают
    rating = Column(Float, nullable=False)          # 1.0 – 5.0
    text = Column(Text, nullable=True)              # Комментарий
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", backref="review", uselist=False)
    reviewer = relationship("User", foreign_keys=[reviewer_id], backref="reviews_given")
    worker = relationship("User", foreign_keys=[worker_id], backref="reviews_received")
