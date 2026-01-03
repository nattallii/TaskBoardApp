import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.board import Board
from app.schemas.board import BoardCreate, BoardUpdate
from app.services.board_service import BoardService


@pytest.fixture
async def created_board(db_session: AsyncSession) -> Board:
    board = Board(title="Initial", description="seed", owner_id=1)
    db_session.add(board)
    await db_session.commit()
    await db_session.refresh(board)
    return board


@pytest.mark.asyncio
async def test_create_board(db_session: AsyncSession):
    data = BoardCreate(title="New board", description="desc")

    result = await BoardService.create_board(db_session, data, owner_id=5)

    assert result.id is not None
    assert result.owner_id == 5
    assert result.title == "New board"


@pytest.mark.asyncio
async def test_get_board_by_id(db_session: AsyncSession, created_board: Board):
    board = await BoardService.get_board_by_id(db_session, created_board.id)

    assert board is not None
    assert board.title == created_board.title


@pytest.mark.asyncio
async def test_get_boards_returns_paginated_list(db_session: AsyncSession, created_board: Board):
    data = BoardCreate(title="Second", description=None)
    await BoardService.create_board(db_session, data, owner_id=2)

    boards, total = await BoardService.get_boards(db_session, skip=0, limit=10, owner_id=None)

    assert total == 2
    assert len(boards) == 2


@pytest.mark.asyncio
async def test_update_board(db_session: AsyncSession, created_board: Board):
    payload = BoardUpdate(title="Updated title", description="New desc")

    updated = await BoardService.update_board(db_session, created_board.id, payload)

    assert updated.title == "Updated title"
    assert updated.description == "New desc"


@pytest.mark.asyncio
async def test_update_board_returns_none_when_missing(db_session: AsyncSession):
    payload = BoardUpdate(title="Does not exist")

    updated = await BoardService.update_board(db_session, board_id=999, board_update=payload)

    assert updated is None


@pytest.mark.asyncio
async def test_delete_board(db_session: AsyncSession, created_board: Board):
    success = await BoardService.delete_board(db_session, created_board.id)

    assert success is True
    assert await BoardService.get_board_by_id(db_session, created_board.id) is None


@pytest.mark.asyncio
async def test_delete_board_returns_false_when_missing(db_session: AsyncSession):
    success = await BoardService.delete_board(db_session, board_id=12345)

    assert success is False
