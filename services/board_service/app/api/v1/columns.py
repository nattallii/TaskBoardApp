from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.schemas.column import ColumnCreate, ColumnUpdate, ColumnResponse
from app.services.column_service import ColumnService
from app.services.board_service import BoardService

router = APIRouter()

@router.get("/board/{board_id}", response_model=List[ColumnResponse])
async def get_board_columns(board_id: int, db: AsyncSession = Depends(get_db)):
    board = await BoardService.get_board_by_id(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    return await ColumnService.get_columns_by_board(db, board_id)

@router.post("/", response_model=ColumnResponse, status_code=status.HTTP_201_CREATED)
async def create_column(column: ColumnCreate, db: AsyncSession = Depends(get_db)):
    board = await BoardService.get_board_by_id(db, column.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    return await ColumnService.create_column(db, column)

@router.put("/{column_id}", response_model=ColumnResponse)
async def update_column(
    column_id: int,
    column_update: ColumnUpdate,
    db: AsyncSession = Depends(get_db),
):
    column = await ColumnService.update_column(db, column_id, column_update)
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    return column

@router.delete("/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(column_id: int, db: AsyncSession = Depends(get_db)):
    success = await ColumnService.delete_column(db, column_id)
    if not success:
        raise HTTPException(status_code=404, detail="Column not found")

@router.post("/board/{board_id}/reorder")
async def reorder_columns(board_id: int, column_order: List[int], db: AsyncSession = Depends(get_db)):
    board = await BoardService.get_board_by_id(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    success = await ColumnService.reorder_columns(db, board_id, column_order)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reorder columns")

    return {"message": "Columns reordered successfully"}
