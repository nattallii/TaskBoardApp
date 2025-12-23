from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.column import Column
from app.schemas.column import ColumnCreate, ColumnUpdate

class ColumnService:

    @staticmethod
    async def get_columns_by_board(db: AsyncSession, board_id: int):
        result = await db.execute(
            select(Column).where(Column.board_id == board_id).order_by(Column.position)
        )
        return result.scalars().all()

    @staticmethod
    async def create_column(db: AsyncSession, column: ColumnCreate):
        db_column = Column(**column.model_dump())
        db.add(db_column)
        await db.commit()
        await db.refresh(db_column)
        return db_column

    @staticmethod
    async def update_column(db: AsyncSession, column_id: int, column_update: ColumnUpdate):
        result = await db.execute(
            select(Column).where(Column.id == column_id)
        )
        db_column = result.scalar_one_or_none()
        if not db_column:
            return None

        for k, v in column_update.model_dump(exclude_unset=True).items():
            setattr(db_column, k, v)

        await db.commit()
        await db.refresh(db_column)
        return db_column

    @staticmethod
    async def delete_column(db: AsyncSession, column_id: int):
        result = await db.execute(
            select(Column).where(Column.id == column_id)
        )
        column = result.scalar_one_or_none()
        if not column:
            return False

        await db.delete(column)
        await db.commit()
        return True
