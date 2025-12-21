from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from .task import TaskResponse

class ColumnBase(BaseModel):
    title: str
    position: int

class ColumnCreate(ColumnBase):
    board_id: int

class ColumnUpdate(BaseModel):
    title: Optional[str] = None
    position: Optional[int] = None

class ColumnResponse(ColumnBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    board_id: int
    tasks: List[TaskResponse] = []