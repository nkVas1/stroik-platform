"""
JWT token generation and validation for secure user sessions.
"""

from datetime import datetime, timedelta
from jose import jwt, JWTError
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.db_models import User

SECRET_KEY = "SUPER_SECRET_STROIK_KEY_CHANGE_ME_IN_PRODUCTION"  # TODO: Move to .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 неделя (1 week)

security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Генерирует JWT токен с переданными данными.
    В токене обычно содержится ID пользователя (sub) и другие метаданные.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Проверяет JWT токен из заголовка Authorization: Bearer <token>.
    Возвращает объект User вместе с его Profile.
    Выбрасывает 401 Unauthorized если токен невалиден или пользователь не найден.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Ищем пользователя и сразу подтягиваем его профиль (selectinload)
    stmt = select(User).options(selectinload(User.profile)).where(User.id == int(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user
