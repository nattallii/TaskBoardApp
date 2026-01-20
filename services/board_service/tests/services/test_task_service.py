import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.board import Board
from app.models.column import Column
from app.models.task import Task
from app.services import task_service


async def create_board(session: AsyncSession, title: str = "Board") -> Board:
    board = Board(title=title, description="desc", owner_id=1)
    session.add(board)
    await session.commit()
    await session.refresh(board)
    return board


async def create_column(
    session: AsyncSession,
    board: Board,
    title: str,
    position: int = 1,
) -> Column:
    column = Column(title=title, position=position, board_id=board.id)
    session.add(column)
    await session.commit()
    await session.refresh(column)
    return column


async def create_task(
    session: AsyncSession,
    column: Column,
    *,
    title: str,
    position: int,
    assignee_id: int | None = None,
) -> Task:
    task = Task(
        title=title,
        description=None,
        position=position,
        column_id=column.id,
        assignee_id=assignee_id,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


@pytest.mark.asyncio
async def test_move_task_clamps_position_to_tasks_plus_one(db_session: AsyncSession):
    board = await create_board(db_session)
    column = await create_column(db_session, board, title="Todo")
    tasks = []
    for idx, title in enumerate(["alpha", "beta", "gamma"], start=1):
        tasks.append(await create_task(db_session, column, title=title, position=idx))

    moved = await task_service.move_task(
        db_session,
        task_id=tasks[0].id,
        to_column_id=column.id,
        task_position=10,
        user_id=board.owner_id,
    )

    assert moved.column_id == column.id
    assert moved.position == 3

    remaining = await db_session.execute(
        select(Task).where(Task.id.in_([tasks[1].id, tasks[2].id])).order_by(Task.id)
    )
    positions = {task.id: task.position for task in remaining.scalars()}
    assert positions[tasks[1].id] == 1
    assert positions[tasks[2].id] == 2


@pytest.mark.asyncio
async def test_move_task_clamps_position_to_minimum(db_session: AsyncSession):
    board = await create_board(db_session)
    column = await create_column(db_session, board, title="Todo")
    task = await create_task(db_session, column, title="alpha", position=1)

    moved = await task_service.move_task(
        db_session,
        task_id=task.id,
        to_column_id=column.id,
        task_position=0,
        user_id=board.owner_id,
    )

    assert moved.position == 1


@pytest.mark.asyncio
async def test_move_task_missing_task_raises(db_session: AsyncSession):
    board = await create_board(db_session)
    column = await create_column(db_session, board, title="Solo")

    with pytest.raises(HTTPException) as exc:
        await task_service.move_task(
            db_session,
            task_id=999,
            to_column_id=column.id,
            task_position=1,
            user_id=board.owner_id,
        )

    assert exc.value.status_code == 404
    assert "Task not found" in exc.value.detail


@pytest.mark.asyncio
async def test_move_task_missing_column_raises(db_session: AsyncSession):
    board = await create_board(db_session)
    column = await create_column(db_session, board, title="Solo")
    task = await create_task(db_session, column, title="move me", position=1)

    with pytest.raises(HTTPException) as exc:
        await task_service.move_task(
            db_session,
            task_id=task.id,
            to_column_id=12345,
            task_position=1,
            user_id=board.owner_id,
        )

    assert exc.value.status_code == 404
    assert "Column not found" in exc.value.detail


@pytest.mark.asyncio
async def test_move_task_rejects_columns_from_different_boards(db_session: AsyncSession):
    board_one = await create_board(db_session, title="Board A")
    board_two = await create_board(db_session, title="Board B")

    source = await create_column(db_session, board_one, title="A")
    other_board_column = await create_column(db_session, board_two, title="B")

    task = await create_task(db_session, source, title="switch", position=1)

    with pytest.raises(HTTPException) as exc:
        await task_service.move_task(
            db_session,
            task_id=task.id,
            to_column_id=other_board_column.id,
            task_position=1,
            user_id=board_one.owner_id,
        )

    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_assign_task_sets_assignee(db_session: AsyncSession):
    board = await create_board(db_session)
    column = await create_column(db_session, board, title="Assign")
    task = await create_task(db_session, column, title="to assign", position=1)

    updated = await task_service.assign_task(db_session, task_id=task.id, assignee_id=77)

    assert updated.assignee_id == 77

    result = await db_session.execute(select(Task).where(Task.id == task.id))
    assert result.scalar_one().assignee_id == 77


@pytest.mark.asyncio
async def test_assign_task_missing_task_raises(db_session: AsyncSession):
    with pytest.raises(HTTPException) as exc:
        await task_service.assign_task(db_session, task_id=555, assignee_id=1)

    assert exc.value.status_code == 404
