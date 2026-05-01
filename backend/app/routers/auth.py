from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token
from app.models.db_models import User
from app.schemas.auth import LoginRequest

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login")
async def login_user(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Вход в существующий аккаунт по user_id."""
    user = await db.get(User, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "message": "Успешный вход"}
