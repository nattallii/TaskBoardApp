from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.schemas.profile import ProfileCreate, ProfileOut, ProfileBase, ProfileUpdate
from app.services import profile_service

from sqlalchemy import select
from app.models.profile import UserProfile




async def create_profile(db: AsyncSession,user_id: int,profile: ProfileCreate):
    new_profile = UserProfile(
        user_id=user_id,
        username=profile.username,
        email=profile.email,
        bio=profile.bio
    )

    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)

    return new_profile


async def get_profile(db: AsyncSession, user_id: int):
    current_profile = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = current_profile.scalar_one_or_none()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")


async def update_profile(db: AsyncSession, user_id: int, profile_data: ProfileUpdate):
    current_profile = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = current_profile.scalar_one_or_none()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    updated_data = profile_data.model_dump(exclude_unset=True)

    for field, value in updated_data.items():
        setattr(profile, field, value)


    await db.commit()
    await db.refresh(profile)
    return profile