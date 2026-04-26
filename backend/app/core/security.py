"""
JWT token generation and validation for secure user sessions.
"""

from datetime import datetime, timedelta
from jose import jwt
from typing import Optional

SECRET_KEY = "SUPER_SECRET_STROIK_KEY_CHANGE_ME_IN_PRODUCTION"  # TODO: Move to .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 неделя (1 week)


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
