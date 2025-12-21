from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.auth import User
from app.core.security import verify_password, hash_password
from app.core.jwt import create_access_token, create_refresh_token


async def login_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> dict:
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

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


async def register_user(
    db: AsyncSession,
    username: str,
    email: str,
    password: str,
) -> dict:
    result = await db.execute(
        select(User).where(User.email == email)
    )
    existing_user = result.scalar_one_or_none()

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

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }
