"""
PATCH /api/users/me — partial profile update.
Split into a separate file to avoid circular import in the main users router.
"""
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..models.database import get_db
from ..models.user import User
from ..auth import get_current_user

router = APIRouter(tags=["users"])


class ProfilePatch(BaseModel):
    fio: Optional[str] = None
    location: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    company_name: Optional[str] = None
    entity_type: Optional[str] = None  # e.g. "self_employed", "ip", "ooo"
    phone: Optional[str] = None
    about: Optional[str] = None


class UserOut(BaseModel):
    id: int
    role: str
    email: Optional[str] = None
    fio: Optional[str] = None
    location: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    company_name: Optional[str] = None
    entity_type: Optional[str] = None
    phone: Optional[str] = None
    about: Optional[str] = None
    verification_level: int

    class Config:
        from_attributes = True


@router.patch("/api/users/me", response_model=UserOut)
def patch_profile(
    data: ProfilePatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Partially update the authenticated user's profile.
    Only provided (non-None) fields are written.
    """
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)

    # Recalculate verification_level based on profile completeness
    level = 0
    if getattr(current_user, "fio", None) and getattr(current_user, "location", None) and getattr(current_user, "specialization", None):
        level = max(level, 1)
    db.commit()
    db.refresh(current_user)
    # Level 1 is already set; levels 2+ are driven by portfolio/doc checks elsewhere
    # but we at least ensure the floor is correct.
    if level != current_user.verification_level and current_user.verification_level == 0:
        current_user.verification_level = level
        db.commit()
        db.refresh(current_user)
    return current_user
