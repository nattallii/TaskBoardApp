from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, status

from app.core.config import settings


def create_access_token(id: int) -> str:
    payload = {
        "sub": str(id),
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def create_refresh_token(id: int) -> str:
    payload = {
        "sub": str(id),
        "exp": datetime.now(timezone.utc)
        + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAY),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def decode_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALG],
        )
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
