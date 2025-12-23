from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.board import Board
from app.schemas.board import BoardCreate, BoardUpdate


class BoardService:

    @staticmethod
    async def get_board_by_id(db: AsyncSession, board_id: int):
        stmt = (
            select(Board)
            .options(selectinload(Board.columns))
            .where(Board.id == board_id)
        )

        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_boards(
        db: AsyncSession,
        skip: int,
        limit: int,
        owner_id: int | None
    ):
        stmt = select(Board).options(selectinload(Board.columns))

        if owner_id:
            stmt = stmt.where(Board.owner_id == owner_id)

        total_stmt = select(func.count()).select_from(stmt.subquery())
        total = await db.scalar(total_stmt)

        result = await db.execute(
            stmt.offset(skip).limit(limit)
        )
        return result.scalars().all(), total

    @staticmethod
    async def create_board(
        db: AsyncSession,
        board: BoardCreate,
        owner_id: int
    ):
        db_board = Board(**board.model_dump(), owner_id=owner_id)
        db.add(db_board)
        await db.commit()

        await db.refresh(db_board)
        return db_board

    @staticmethod
    async def update_board(
        db: AsyncSession,
        board_id: int,
        board_update: BoardUpdate
    ):
        board = await BoardService.get_board_by_id(db, board_id)
        if not board:
            return None

        for k, v in board_update.model_dump(exclude_unset=True).items():
            setattr(board, k, v)

        await db.commit()
        await db.refresh(board)
        return board

    @staticmethod
    async def delete_board(db: AsyncSession, board_id: int):
        board = await BoardService.get_board_by_id(db, board_id)
        if not board:
            return False

        await db.delete(board)
        await db.commit()
        return True
