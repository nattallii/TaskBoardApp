from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.task import Task
from app.models.column import Column

async def move_task(
    session: AsyncSession,
    task_id: int,
    to_column_id: int,
    task_position: int,
    user_id: int,
):
    task_result = await session.execute(
        select(Task).where(Task.id == task_id)
    )
    task = task_result.scalar_one_or_none()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")


    column_result = await session.execute(select(Column).where(Column.id == to_column_id))
    column = column_result.scalar_one_or_none()

    if column is None:
        raise HTTPException(status_code=404, detail="Column not found")


    if column.board_id != task.column.board_id:
        raise HTTPException(status_code=400, detail="Column does not belong to the same board")

    tasks_result = await session.execute(select(Task).where(Task.id == task_id))
    tasks_in_column = tasks_result.scalars().all()
    tasks_count = len(tasks_in_column)

    if tasks_in_column is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_position < 1:
        task_position = 1

    elif task_position > tasks_count + 1:
        task_position = tasks_count + 1


    for task in tasks_in_column:
        if task.position >= task_position:
            task.position += 1


    task.column_id = to_column_id
    task.position = task_position

    await session.commit()
    await session.refresh(task)

    return task


async def assign_task(session: AsyncSession, task_id: int, assignee_id: int | None):
    current_task = await session.execute(select(Task).where(Task.id == task_id))
    task = current_task.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    task.assignee_id = assignee_id

    await session.commit()
    await session.refresh(task)

    return task