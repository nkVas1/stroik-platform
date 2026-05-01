from pydantic import BaseModel, Field
from typing import Optional, List


class ProjectCreateRequest(BaseModel):
    """Тело запроса для прямого создания проекта (POST /api/projects)"""
    title: str = Field(..., min_length=5, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    budget: Optional[int] = Field(None, ge=0)
    required_specialization: Optional[str] = Field(None, max_length=100)


class BidCreateRequest(BaseModel):
    cover_letter: Optional[str] = "Готов выполнить работу качественно и в срок."
    price_offer: Optional[int] = None


class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    budget: Optional[int] = None
    specialization: Optional[str] = None
    created_at: Optional[str] = None
    employer_name: str
    location: str


class BidResponse(BaseModel):
    id: int
    worker_name: str
    worker_spec: Optional[str] = None
    cover_letter: Optional[str] = None
    price_offer: Optional[int] = None
    status: str


class ProjectWithBidsResponse(BaseModel):
    id: int
    title: str
    status: str
    bids: List[BidResponse] = []
