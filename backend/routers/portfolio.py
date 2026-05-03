import os
import json
import shutil
import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..models.database import get_db
from ..models.portfolio import PortfolioCase
from ..models.user import User
from ..auth import get_current_user

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "photos"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "contracts"), exist_ok=True)


class PortfolioCaseOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    work_type: Optional[str] = None
    city: Optional[str] = None
    year_completed: Optional[int] = None
    budget: Optional[str] = None
    client_name: Optional[str] = None
    photo_url: Optional[str] = None
    contract_url: Optional[str] = None
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


def _save_file(upload: UploadFile, subdir: str) -> str:
    """Save uploaded file to disk and return relative URL path."""
    ext = os.path.splitext(upload.filename or "")[1].lower() or ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(UPLOAD_DIR, subdir, filename)
    with open(dest, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    return f"/static/{subdir}/{filename}"


@router.get("", response_model=List[PortfolioCaseOut])
def list_my_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return authenticated user's portfolio cases, newest first."""
    cases = (
        db.query(PortfolioCase)
        .filter(PortfolioCase.user_id == current_user.id)
        .order_by(PortfolioCase.created_at.desc())
        .all()
    )
    return cases


@router.post("", response_model=PortfolioCaseOut, status_code=status.HTTP_201_CREATED)
async def create_case(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    work_type: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    year_completed: Optional[int] = Form(None),
    budget: Optional[str] = Form(None),
    client_name: Optional[str] = Form(None),
    photos: List[UploadFile] = File(default=[]),
    contract: Optional[UploadFile] = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new portfolio case."""
    if current_user.role == "employer":
        raise HTTPException(status_code=403, detail="Only workers can create portfolio cases")

    # Save photos (max 10)
    photo_urls: List[str] = []
    for photo in photos[:10]:
        if photo.content_type and photo.content_type.startswith("image/"):
            url = _save_file(photo, "photos")
            photo_urls.append(url)

    # Save contract
    contract_url: Optional[str] = None
    if contract and contract.filename:
        contract_url = _save_file(contract, "contracts")

    case = PortfolioCase(
        user_id=current_user.id,
        title=title,
        description=description,
        work_type=work_type,
        city=city,
        year_completed=year_completed,
        budget=budget,
        client_name=client_name,
        photo_url=json.dumps(photo_urls) if photo_urls else None,
        contract_url=contract_url,
        is_verified=False,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an owned portfolio case."""
    case = db.query(PortfolioCase).filter(
        PortfolioCase.id == case_id,
        PortfolioCase.user_id == current_user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()


@router.get("/public/{user_id}", response_model=List[PortfolioCaseOut])
def get_public_cases(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Return a worker's public portfolio (for profile pages, AI matching)."""
    cases = (
        db.query(PortfolioCase)
        .filter(PortfolioCase.user_id == user_id)
        .order_by(PortfolioCase.is_verified.desc(), PortfolioCase.created_at.desc())
        .all()
    )
    return cases
