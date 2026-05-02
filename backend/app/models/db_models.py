import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, JSON, ForeignKey,
    Enum as SQLEnum, DateTime, Text, Float, UniqueConstraint
)
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
    """Stored as INTEGER in the DB (not as an Enum/VARCHAR column)."""
    NONE = 0
    BASIC = 1
    CONTACTS = 2
    PASSPORT = 3


class ProjectStatus(str, enum.Enum):
    """Values are lowercase — matching server_default and existing DB rows."""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BidStatus(str, enum.Enum):
    """Values are lowercase — matching server_default and existing DB rows."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    profile = relationship(
        "Profile", back_populates="user",
        uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )
    projects = relationship("Project", back_populates="employer", cascade="all, delete-orphan")
    bids = relationship("Bid", back_populates="worker", cascade="all, delete-orphan")
    reviews_given = relationship(
        "Review", foreign_keys="Review.reviewer_id", back_populates="reviewer"
    )
    reviews_received = relationship(
        "Review", foreign_keys="Review.worker_id", back_populates="worker_user"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Stored as VARCHAR(32); Python enum used for type-safety in ORM queries
    role = Column(
        SQLEnum(UserRole, native_enum=False, length=32),
        default=UserRole.UNKNOWN, nullable=False
    )
    entity_type = Column(
        SQLEnum(EntityType, native_enum=False, length=32),
        default=EntityType.UNKNOWN, nullable=False
    )

    # Stored as INTEGER — VerificationLevel.value is already int
    verification_level = Column(Integer, default=0, nullable=False)

    company_name = Column(String, nullable=True)
    fio = Column(String, nullable=True)
    location = Column(String, nullable=True)
    email = Column(String, nullable=True)        # contact email (not auth)
    phone = Column(String, nullable=True)        # contact phone
    language_proficiency = Column(String, nullable=True)
    work_authorization = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    project_scope = Column(String, nullable=True)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    user = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<Profile user_id={self.user_id} role={self.role} level={self.verification_level}>"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    budget = Column(Integer, nullable=True)
    required_specialization = Column(String, nullable=True)
    # Stored as VARCHAR(32) with lowercase values
    status = Column(String(32), default=ProjectStatus.OPEN.value, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    employer = relationship("User", back_populates="projects")
    bids = relationship("Bid", back_populates="project", cascade="all, delete-orphan")
    review = relationship(
        "Review", back_populates="project", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} title={self.title!r} status={self.status!r}>"


class Bid(Base):
    __tablename__ = "bids"
    __table_args__ = (
        UniqueConstraint("project_id", "worker_id", name="uq_bid_project_worker"),
    )

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    worker_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    cover_letter = Column(String, nullable=True)
    price_offer = Column(Integer, nullable=True)
    # Stored as VARCHAR(32) with lowercase values
    status = Column(String(32), default=BidStatus.PENDING.value, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="bids")
    worker = relationship("User", back_populates="bids")

    def __repr__(self) -> str:
        return f"<Bid id={self.id} project_id={self.project_id} status={self.status!r}>"


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    reviewer_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    worker_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating = Column(Float, nullable=False)
    text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="review")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    worker_user = relationship(
        "User", foreign_keys=[worker_id], back_populates="reviews_received"
    )

    def __repr__(self) -> str:
        return f"<Review id={self.id} project_id={self.project_id} rating={self.rating}>"
