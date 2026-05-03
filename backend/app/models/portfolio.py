from sqlalchemy import Column, Integer, String, Boolean, Text, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class PortfolioCase(Base):
    __tablename__ = "portfolio_cases"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    work_type = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    year_completed = Column(Integer, nullable=True)
    budget = Column(String(50), nullable=True)
    client_name = Column(String(200), nullable=True)
    photo_urls = Column(JSON, nullable=True)          # list[str]
    contract_url = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    worker = relationship("User", foreign_keys=[worker_id])

    def __repr__(self) -> str:
        return f"<PortfolioCase id={self.id} worker_id={self.worker_id} title={self.title!r}>"
