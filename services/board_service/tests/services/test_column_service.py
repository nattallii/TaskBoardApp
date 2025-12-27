import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.board import Board
from app.schemas.column import ColumnCreate, ColumnUpdate
from app.services.column_service import ColumnService


@pytest.fixture
async def board(db_session: AsyncSession) -> Board:
    board = Board(title="Board", description="has columns", owner_id=7)
    db_session.add(board)
    await db_session.commit()
    await db_session.refresh(board)
    return board


@pytest.mark.asyncio
async def test_create_column(db_session: AsyncSession, board: Board):
    payload = ColumnCreate(title="Todo", position=1, board_id=board.id)

    column = await ColumnService.create_column(db_session, payload)

    assert column.id is not None
    assert column.board_id == board.id
    assert column.title == "Todo"


@pytest.mark.asyncio
async def test_get_columns_by_board(db_session: AsyncSession, board: Board):
    await ColumnService.create_column(
        db_session, ColumnCreate(title="A", position=1, board_id=board.id)
    )
    await ColumnService.create_column(
        db_session, ColumnCreate(title="B", position=2, board_id=board.id)
    )

    columns = await ColumnService.get_columns_by_board(db_session, board_id=board.id)

    assert len(columns) == 2
    assert [c.title for c in columns] == ["A", "B"]


@pytest.mark.asyncio
async def test_update_column(db_session: AsyncSession, board: Board):
    column = await ColumnService.create_column(
        db_session, ColumnCreate(title="Old", position=1, board_id=board.id)
    )

    updated = await ColumnService.update_column(
        db_session,
        column_id=column.id,
        column_update=ColumnUpdate(title="New title", position=3),
    )

    assert updated.title == "New title"
    assert updated.position == 3


@pytest.mark.asyncio
async def test_update_column_missing_returns_none(db_session: AsyncSession):
    updated = await ColumnService.update_column(
        db_session, column_id=1234, column_update=ColumnUpdate(title="noop")
    )

    assert updated is None


@pytest.mark.asyncio
async def test_delete_column(db_session: AsyncSession, board: Board):
    column = await ColumnService.create_column(
        db_session, ColumnCreate(title="Tmp", position=0, board_id=board.id)
    )

    success = await ColumnService.delete_column(db_session, column_id=column.id)

    assert success is True
    columns = await ColumnService.get_columns_by_board(db_session, board.id)
    assert all(c.id != column.id for c in columns)


@pytest.mark.asyncio
async def test_delete_column_missing_returns_false(db_session: AsyncSession):
    success = await ColumnService.delete_column(db_session, column_id=9999)

    assert success is False
