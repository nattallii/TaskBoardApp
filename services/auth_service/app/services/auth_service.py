from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.auth import User
from app.core.security import verify_password, hash_password
from app.core.jwt import create_access_token, create_refresh_token


def login_user(db: Session, email: str, password: str) -> dict:
    user = db.scalar(select(User).where(User.email == email))

    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


def register_user(db: Session, username: str, email: str, password: str) -> dict:
    existing_user = db.scalar(select(User).where(User.email == email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        username=username,
        email=email,
        password=hash_password(password),
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }
