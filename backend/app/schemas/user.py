from pydantic import BaseModel
from typing import Optional


class UserMeResponse(BaseModel):
    """Данные текущего пользователя для /api/users/me"""
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


class ManualProfileUpdateRequest(BaseModel):
    """Тело запроса для ручного обновления профиля /api/users/me/manual"""
    fio: Optional[str] = None
    location: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
