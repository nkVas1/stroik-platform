from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class PortfolioCase(Base):
    __tablename__ = "portfolio_cases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    work_type = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    year_completed = Column(Integer, nullable=True)
    budget = Column(String(50), nullable=True)  # human-readable string e.g. "150 000 ₽"
    client_name = Column(String(100), nullable=True)
    photo_url = Column(Text, nullable=True)  # JSON array of URLs stored as text
    contract_url = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="portfolio_cases")
