from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.profile_service import get_profile, update_profile
from app.db.session import get_db
from app.schemas.profile import ProfileOut, ProfileBase, ProfileUpdate
from app.services.profile_service import get_profile
from app.core.deps import get_current_user_id

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get('/me', response_model=ProfileOut)
async def get_my_profile(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return await get_profile(db, user_id)


@router.patch("/me", response_model=ProfileOut)
async def update_my_profile(
    profile_data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return await update_profile(
        db=db,
        user_id=user_id,
        profile_data=profile_data
    )
