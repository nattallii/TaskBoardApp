from fastapi import APIRouter
from app.api.v1.profile import router as profile_router

router = APIRouter()
router.include_router(profile_router)