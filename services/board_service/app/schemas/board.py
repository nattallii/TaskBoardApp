from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from .column import ColumnResponse

# Base schemas
class BoardBase(BaseModel):
    title: str
    description: Optional[str] = None

class BoardCreate(BoardBase):
    pass

class BoardUpdate(BoardBase):
    title: Optional[str] = None

# Response schemas
class BoardResponse(BoardBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    columns: List[ColumnResponse] = []

class BoardListResponse(BaseModel):
    boards: List[BoardResponse]
    total: int