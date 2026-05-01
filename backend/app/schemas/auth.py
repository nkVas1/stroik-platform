from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Тело запроса для входа по user_id /api/login"""
    user_id: int
