from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import UserLogin, UserCreate, Token
from app.db.session import get_db
from app.services.auth_service import login_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    return await login_user(db, payload.email, payload.password)

@router.post("/register", response_model=Token)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register_user(db,payload.username, payload.email, payload.password)


