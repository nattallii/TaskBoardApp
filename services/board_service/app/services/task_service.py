from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.task import Task
from app.models.column import Column


async def _get_tasks_by_column(session: AsyncSession, column_id: int):
    result = await session.execute(
        select(Task)
        .where(Task.column_id == column_id)
        .order_by(Task.position)
    )
    return list(result.scalars().all())


def _clamp_position(position: int, max_length: int) -> int:
    if position < 1:
        return 1
    if position > max_length:
        return max_length
    return position


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
    target_column = column_result.scalar_one_or_none()

    if target_column is None:
        raise HTTPException(status_code=404, detail="Column not found")

    if target_column.board_id != task.column.board_id:
        raise HTTPException(status_code=400, detail="Column does not belong to the same board")

    source_column_id = task.column_id

    source_tasks = await _get_tasks_by_column(session, source_column_id)
    target_tasks = source_tasks if source_column_id == to_column_id else await _get_tasks_by_column(session, to_column_id)

    # Remove task from source ordering
    source_tasks = [t for t in source_tasks if t.id != task.id]
    for idx, t in enumerate(source_tasks, start=1):
        t.position = idx

    if source_column_id == to_column_id:
        target_tasks = source_tasks

    insert_index = _clamp_position(task_position, len(target_tasks) + 1) - 1
    target_tasks.insert(insert_index, task)

    task.column_id = to_column_id

    for idx, t in enumerate(target_tasks, start=1):
        t.position = idx

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