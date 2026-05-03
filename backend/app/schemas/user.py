from pydantic import BaseModel
from typing import Optional


class UserMeResponse(BaseModel):
    id: int
    is_verified: bool
    role: str
    entity_type: str
    company_name: Optional[str] = None
    verification_level: int
    fio: Optional[str] = None
    location: Optional[str] = None
    email: Optional[str] = None
    language_proficiency: Optional[str] = None
    work_authorization: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    project_scope: Optional[str] = None
    created_at: Optional[str] = None
    plan: Optional[str] = "free"


class ManualProfileUpdateRequest(BaseModel):
    fio: Optional[str] = None
    location: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
