import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.auth import User
from app.schemas.auth import UserCreate
from app.services import auth_service


@pytest.fixture
async def user(db_session: AsyncSession) -> User:
    db_user = User(
        username="tester",
        email="tester@example.com",
        password=hash_password("password123"),
    )
    db_session.add(db_user)
    await db_session.commit()
    await db_session.refresh(db_user)
    return db_user


@pytest.mark.asyncio
async def test_login_user_success(db_session: AsyncSession, user: User):
    result = await auth_service.login_user(
        db_session,
        email="tester@example.com",
        password="password123",
    )

    assert "access_token" in result and "refresh_token" in result
    assert result["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_user_invalid_password(db_session: AsyncSession, user: User):
    with pytest.raises(HTTPException) as exc:
        await auth_service.login_user(db_session, user.email, "wrong")

    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_register_user_creates_profile_event(monkeypatch, db_session: AsyncSession):
    called = {}

    async def fake_publish_profile_create_event(user_id, username, bio):
        called["user_id"] = user_id
        called["username"] = username
        called["bio"] = bio

    monkeypatch.setattr(
        auth_service,
        "publish_profile_create_event",
        fake_publish_profile_create_event,
    )

    payload = UserCreate(username="newbie", email="new@example.com", password="secret")

    tokens = await auth_service.register_user(
        db_session,
        username=payload.username,
        email=payload.email,
        password=payload.password,
    )

    assert "access_token" in tokens
    assert called["username"] == "newbie"


@pytest.mark.asyncio
async def test_register_user_duplicate_email(monkeypatch, db_session: AsyncSession, user: User):
    async def fake_publish_profile_create_event(*args, **kwargs):
        raise AssertionError("Should not be called")

    monkeypatch.setattr(
        auth_service,
        "publish_profile_create_event",
        fake_publish_profile_create_event,
    )

    with pytest.raises(HTTPException) as exc:
        await auth_service.register_user(
            db_session,
            username="tester",
            email=user.email,
            password="anything",
        )

    assert exc.value.status_code == 409
