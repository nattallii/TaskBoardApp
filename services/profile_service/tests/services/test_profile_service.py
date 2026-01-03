import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.models.profile import UserProfile
from app.schemas.profile import ProfileCreate, ProfileUpdate
from app.services.profile_service import (
    create_profile_if_not_exists,
    get_profile,
    update_profile,
)


@pytest.mark.asyncio
async def test_create_profile_if_not_exists_creates_profile(db_session):
    profile = await create_profile_if_not_exists(
        db_session,
        user_id=1,
        profile=ProfileCreate(username="alex", bio="hi"),
    )

    assert profile.user_id == 1
    assert profile.username == "alex"
    assert profile.bio == "hi"

    result = await db_session.execute(select(UserProfile))
    rows = result.scalars().all()
    assert len(rows) == 1


@pytest.mark.asyncio
async def test_create_profile_if_not_exists_returns_existing(db_session):
    created = await create_profile_if_not_exists(
        db_session,
        user_id=2,
        profile=ProfileCreate(username="first", bio=None),
    )

    result = await create_profile_if_not_exists(
        db_session,
        user_id=2,
        profile=ProfileCreate(username="second", bio="ignored"),
    )

    assert result.user_id == created.user_id
    assert result.username == "first"
    assert result.bio is None

    rows = (await db_session.execute(select(UserProfile))).scalars().all()
    assert len(rows) == 1


@pytest.mark.asyncio
async def test_get_profile_returns_existing(db_session):
    await create_profile_if_not_exists(
        db_session,
        user_id=3,
        profile=ProfileCreate(username="exists", bio=None),
    )

    profile = await get_profile(db_session, user_id=3)

    assert profile.user_id == 3
    assert profile.username == "exists"


@pytest.mark.asyncio
async def test_get_profile_raises_when_missing(db_session):
    with pytest.raises(HTTPException) as exc:
        await get_profile(db_session, user_id=999)

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_update_profile_updates_fields(db_session):
    await create_profile_if_not_exists(
        db_session,
        user_id=4,
        profile=ProfileCreate(username="old", bio="bio"),
    )

    updated = await update_profile(
        db_session,
        user_id=4,
        profile_data=ProfileUpdate(username="new-name"),
    )

    assert updated.username == "new-name"
    assert updated.bio == "bio"


@pytest.mark.asyncio
async def test_update_profile_raises_when_missing(db_session):
    with pytest.raises(HTTPException) as exc:
        await update_profile(
            db_session,
            user_id=5,
            profile_data=ProfileUpdate(username="ghost"),
        )

    assert exc.value.status_code == 404
