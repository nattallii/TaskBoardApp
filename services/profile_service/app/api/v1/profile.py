from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.schemas.profile import ProfileOut, ProfileBase, ProfileUpdate
from app.services import profile_service

from app.core.deps import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get('/me', response_model=ProfileOut)
async def get_my_profile(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    profile = await profile_service.get_profile(db, user_id)

    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='no such profile')

    return profile


@router.patch("/me/update", response_model=ProfileOut)
async def update_my_profile(
    profile_data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    return await profile_service.update_profile(
        db=db,
        user_id=user_id,
        profile_data=profile_data
    )
