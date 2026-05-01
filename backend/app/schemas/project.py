from pydantic import BaseModel
from typing import Optional, List


class BidCreateRequest(BaseModel):
    """Тело запроса для отклика на проект /api/projects/{id}/bids"""
    cover_letter: Optional[str] = "Готов выполнить работу качественно и в срок."
    price_offer: Optional[int] = None


class ProjectResponse(BaseModel):
    """Проект для Live Feed (список заказов для работников)"""
    id: int
    title: str
    description: Optional[str] = None
    budget: Optional[int] = None
    specialization: Optional[str] = None
    created_at: Optional[str] = None
    employer_name: str
    location: str


class BidResponse(BaseModel):
    """Отклик на проект (для дашборда работодателя)"""
    id: int
    worker_name: str
    worker_spec: Optional[str] = None
    cover_letter: Optional[str] = None
    price_offer: Optional[int] = None
    status: str


class ProjectWithBidsResponse(BaseModel):
    """Проект с откликами (для дашборда работодателя)"""
    id: int
    title: str
    status: str
    bids: List[BidResponse] = []
