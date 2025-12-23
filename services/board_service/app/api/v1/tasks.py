from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.models.task import Task
from app.models.column import Column
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter()


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task))
    return result.scalars().all()


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(task: TaskCreate, db: AsyncSession = Depends(get_db)):
    # check column exists
    result = await db.execute(
        select(Column).where(Column.id == task.column_id)
    )
    column = result.scalar_one_or_none()

    if not column:
        raise HTTPException(status_code=404, detail="Column not found")

    db_task = Task(**task.model_dump())
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)

    return db_task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    db_task = result.scalar_one_or_none()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)

    await db.commit()
    await db.refresh(db_task)

    return db_task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    db_task = result.scalar_one_or_none()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(db_task)
    await db.commit()
