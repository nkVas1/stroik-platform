import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, JSON,
    ForeignKey, Enum as SQLEnum, DateTime, Text, Float, Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


# ── Enums ─────────────────────────────────────────────────────────────────────
# IMPORTANT: string values MUST match the DDL CHECK constraint produced by the
# Alembic migrations (uppercase).  SQLite stores them as-is.

class UserRole(str, enum.Enum):
    WORKER   = "worker"
    EMPLOYER = "employer"
    UNKNOWN  = "unknown"


class EntityType(str, enum.Enum):
    PHYSICAL = "physical"
    LEGAL    = "legal"
    UNKNOWN  = "unknown"


class VerificationLevel(int, enum.Enum):
    NONE     = 0
    BASIC    = 1
    CONTACTS = 2
    PASSPORT = 3


class ProjectStatus(str, enum.Enum):
    OPEN        = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED   = "completed"
    CANCELLED   = "cancelled"


class BidStatus(str, enum.Enum):
    PENDING  = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


# ── Models ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    phone         = Column(String, unique=True, index=True, nullable=True)   # legacy
    email         = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    is_verified   = Column(Boolean, default=False, nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    profile = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",   # always loaded with User — avoids N+1 in auth middleware
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"


class Profile(Base):
    __tablename__ = "profiles"

    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    role                 = Column(SQLEnum(UserRole,   name="userrole"),         default=UserRole.UNKNOWN,         nullable=False)
    verification_level   = Column(SQLEnum(VerificationLevel, name="verificationlevel"), default=VerificationLevel.NONE, nullable=False)
    entity_type          = Column(SQLEnum(EntityType, name="entitytype"),       default=EntityType.UNKNOWN,       nullable=False)
    company_name         = Column(String, nullable=True)
    fio                  = Column(String, nullable=True)
    location             = Column(String, nullable=True)
    # contact email stored in profile (different from auth email in users table)
    email                = Column(String, nullable=True)
    phone                = Column(String, nullable=True)
    language_proficiency = Column(String, nullable=True)
    work_authorization   = Column(String, nullable=True)
    specialization       = Column(String, nullable=True)
    experience_years     = Column(Integer, nullable=True)
    project_scope        = Column(String, nullable=True)
    raw_data             = Column(JSON, nullable=True)
    created_at           = Column(DateTime(timezone=True), server_default=func.now())
    updated_at           = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<Profile user_id={self.user_id} role={self.role} level={self.verification_level}>"


class Project(Base):
    __tablename__ = "projects"

    id                     = Column(Integer, primary_key=True, index=True)
    employer_id            = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title                  = Column(String,  nullable=False)
    description            = Column(Text,    nullable=True)
    budget                 = Column(Integer, nullable=True)
    required_specialization = Column(String, nullable=True)
    status                 = Column(SQLEnum(ProjectStatus, name="projectstatus"), default=ProjectStatus.OPEN, nullable=False)
    created_at             = Column(DateTime(timezone=True), server_default=func.now())

    employer = relationship("User", foreign_keys=[employer_id], backref="projects")
    bids     = relationship("Bid",  back_populates="project",  cascade="all, delete-orphan")
    review   = relationship("Review", back_populates="project", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Project id={self.id} title={self.title!r} status={self.status}>"


class Bid(Base):
    __tablename__ = "bids"

    id           = Column(Integer, primary_key=True, index=True)
    project_id   = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    worker_id    = Column(Integer, ForeignKey("users.id",    ondelete="CASCADE"), nullable=False)
    cover_letter = Column(String,  nullable=True)
    price_offer  = Column(Integer, nullable=True)
    status       = Column(SQLEnum(BidStatus, name="bidstatus"), default=BidStatus.PENDING, nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="bids")
    worker  = relationship("User",    foreign_keys=[worker_id], backref="bids")

    __table_args__ = (
        Index("ix_bids_worker_project", "worker_id", "project_id"),
    )

    def __repr__(self) -> str:
        return f"<Bid id={self.id} project={self.project_id} worker={self.worker_id} status={self.status}>"


class Review(Base):
    __tablename__ = "reviews"

    id          = Column(Integer, primary_key=True, index=True)
    project_id  = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id",    ondelete="CASCADE"), nullable=False)
    worker_id   = Column(Integer, ForeignKey("users.id",    ondelete="CASCADE"), nullable=False)
    rating      = Column(Float,   nullable=False)
    text        = Column(Text,    nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    project  = relationship("Project",  back_populates="review")
    reviewer = relationship("User",     foreign_keys=[reviewer_id], backref="reviews_given")
    worker   = relationship("User",     foreign_keys=[worker_id],   backref="reviews_received")

    __table_args__ = (
        Index("ix_reviews_worker_id", "worker_id"),
    )

    def __repr__(self) -> str:
        return f"<Review id={self.id} project={self.project_id} rating={self.rating}>"
