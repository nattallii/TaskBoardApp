from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProfileBase(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class ProfileOut(ProfileBase):
    user_id: int

    model_config = ConfigDict(from_attributes=True)