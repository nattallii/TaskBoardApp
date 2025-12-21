from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.auth import UserLogin, UserCreate, Token
from app.db.session import get_db
from app.services.auth_service import login_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, payload.email, payload.password)

@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    return register_user(db,payload.username, payload.email, payload.password)
