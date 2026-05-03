from pydantic import BaseModel
from typing import Optional, List


class PortfolioCaseOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    work_type: Optional[str] = None
    city: Optional[str] = None
    year_completed: Optional[int] = None
    budget: Optional[str] = None
    client_name: Optional[str] = None
    photo_url: Optional[str] = None   # first photo URL (convenience)
    photo_urls: Optional[List[str]] = None
    contract_url: Optional[str] = None
    is_verified: bool
    created_at: str

    model_config = {"from_attributes": True}
