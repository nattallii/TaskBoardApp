from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    position: int

class TaskCreate(TaskBase):
    column_id: int
    assignee_id: Optional[int] = None

class AssignTask(BaseModel):
    assignee_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = None
    column_id: Optional[int] = None
    assignee_id: Optional[int] = None


class MoveTask(TaskBase):
    column_id: int
    task_position: int


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    column_id: int
    assignee_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None