from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict


class ProfileBase(BaseModel):
    username: str
    email: EmailStr
    bio: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class ProfileOut(ProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)