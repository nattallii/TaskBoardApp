from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.core.config import settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG],)

        if payload.get('type') != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid token')

        user_id = payload.get('sub')
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid token')
        return int(user_id)


    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='could not validate credentials')
