import os
import uuid
import logging
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User
from app.models.portfolio import PortfolioCase
from app.schemas.portfolio import PortfolioCaseOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

UPLOAD_DIR = Path("uploads/portfolio")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_DOC_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_PHOTOS = 10
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _save_upload(upload: UploadFile, sub: str) -> str:
    """Save upload to disk and return relative URL."""
    dest = UPLOAD_DIR / sub
    dest.mkdir(parents=True, exist_ok=True)
    ext = Path(upload.filename or "").suffix or ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    path = dest / filename
    data = upload.file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Файл слишком большой (max 10 MB)")
    path.write_bytes(data)
    return f"/uploads/portfolio/{sub}/{filename}"


def _case_to_schema(c: PortfolioCase) -> PortfolioCaseOut:
    photos: list = c.photo_urls or []
    first_photo = photos[0] if photos else None
    return PortfolioCaseOut(
        id=c.id,
        title=c.title,
        description=c.description,
        work_type=c.work_type,
        city=c.city,
        year_completed=c.year_completed,
        budget=c.budget,
        client_name=c.client_name,
        photo_url=first_photo,
        photo_urls=photos,
        contract_url=c.contract_url,
        is_verified=c.is_verified,
        created_at=c.created_at.isoformat() if c.created_at else "",
    )


@router.get("", response_model=List[PortfolioCaseOut])
async def list_my_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """GET /api/portfolio  — портфолио текущего пользователя."""
    stmt = (
        select(PortfolioCase)
        .where(PortfolioCase.worker_id == current_user.id)
        .order_by(PortfolioCase.created_at.desc())
    )
    result = await db.execute(stmt)
    cases = result.scalars().all()
    return [_case_to_schema(c) for c in cases]


@router.get("/public/{worker_id}", response_model=List[PortfolioCaseOut])
async def list_public_portfolio(
    worker_id: int,
    db: AsyncSession = Depends(get_db),
):
    """GET /api/portfolio/public/{worker_id}  — публичный просмотр."""
    stmt = (
        select(PortfolioCase)
        .where(
            PortfolioCase.worker_id == worker_id,
        )
        .order_by(PortfolioCase.created_at.desc())
    )
    result = await db.execute(stmt)
    return [_case_to_schema(c) for c in result.scalars().all()]


@router.post("", response_model=PortfolioCaseOut, status_code=201)
async def create_portfolio_case(
    title: str = Form(...),
    description: str = Form(""),
    work_type: str = Form("Other"),
    city: str = Form(""),
    year_completed: int = Form(default=2024),
    budget: Optional[str] = Form(default=None),
    client_name: Optional[str] = Form(default=None),
    photos: List[UploadFile] = File(default=[]),
    contract: Optional[UploadFile] = File(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """POST /api/portfolio  — создать новый кейс."""
    sub = str(current_user.id)

    photo_urls: list[str] = []
    for photo in photos[:MAX_PHOTOS]:
        if photo.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail=f"Недопустимый тип фото: {photo.content_type}")
        url = _save_upload(photo, sub)
        photo_urls.append(url)

    contract_url: str | None = None
    if contract and contract.filename:
        if contract.content_type not in ALLOWED_DOC_TYPES:
            raise HTTPException(status_code=400, detail="Договор: допустимы PDF, JPG, PNG")
        contract_url = _save_upload(contract, f"{sub}/contracts")

    case = PortfolioCase(
        worker_id=current_user.id,
        title=title.strip(),
        description=description.strip() or None,
        work_type=work_type or None,
        city=city.strip() or None,
        year_completed=year_completed,
        budget=budget,
        client_name=client_name,
        photo_urls=photo_urls,
        contract_url=contract_url,
        is_verified=bool(contract_url),  # will be set True by moderator later; pre-flag if contract exists
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)
    logger.info("💼 New portfolio case #%d for worker %d", case.id, current_user.id)
    return _case_to_schema(case)


@router.delete("/{case_id}", status_code=204)
async def delete_portfolio_case(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """DELETE /api/portfolio/{case_id}"""
    stmt = select(PortfolioCase).where(
        PortfolioCase.id == case_id,
        PortfolioCase.worker_id == current_user.id,
    )
    result = await db.execute(stmt)
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Кейс не найден")
    # Delete physical files
    for url in (case.photo_urls or []):
        try:
            fp = Path(url.lstrip("/"))
            if fp.exists():
                os.remove(fp)
        except Exception:
            pass
    if case.contract_url:
        try:
            fp = Path(case.contract_url.lstrip("/"))
            if fp.exists():
                os.remove(fp)
        except Exception:
            pass
    await db.delete(case)
    await db.commit()
