from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
import logging

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.models.db_models import User, Profile, UserRole, EntityType

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Схемы ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="unknown")  # worker | employer | unknown


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AttachEmailRequest(BaseModel):
    """  Привязать email/пароль к уже существующему guest-аккаунту (after onboarding). """
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str


# ── Хелперы ─────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── Эндпоинты ─────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Регистрация нового пользователя через email + пароль."""
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким email уже зарегистрирован"
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        is_verified=False,
    )
    db.add(user)
    await db.flush()

    role_enum = UserRole.WORKER if data.role == "worker" else (
        UserRole.EMPLOYER if data.role == "employer" else UserRole.UNKNOWN
    )
    profile = Profile(user_id=user.id, role=role_enum)
    db.add(profile)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    logger.info(f"🎉 Регистрация: User #{user.id} ({data.email}) role={data.role}")
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=data.role,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Вход по email + пароль."""
    res = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.email == data.email)
    )
    user = res.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )

    token = create_access_token({"sub": str(user.id)})
    role = user.profile.role.value if user.profile else "unknown"
    logger.info(f"✅ Вход: User #{user.id} ({data.email})")
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=role,
    )


@router.post("/attach-email", response_model=TokenResponse)
async def attach_email(
    data: AttachEmailRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Привязать email+пароль к гостевому аккаунту.
    Позволяет пользователю, созданному через ИИ-онбординг,
    закрепить аккаунт через email.
    """
    if current_user.email:
        raise HTTPException(
            status_code=400,
            detail="Email уже привязан к аккаунту"
        )

    # Проверяем уникальность email
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Данный email уже занят другим аккаунтом"
        )

    current_user.email = data.email
    current_user.password_hash = hash_password(data.password)
    await db.commit()

    token = create_access_token({"sub": str(current_user.id)})
    role = current_user.profile.role.value if current_user.profile else "unknown"
    logger.info(f"🔗 Email привязан: User #{current_user.id} → {data.email}")
    return TokenResponse(
        access_token=token,
        user_id=current_user.id,
        role=role,
    )


@router.get("/me")
async def get_auth_me(current_user: User = Depends(get_current_user)):
    """Быстрая проверка токена и получение базовых данных аут."""
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "has_password": bool(current_user.password_hash),
        "role": current_user.profile.role.value if current_user.profile else "unknown",
    }
