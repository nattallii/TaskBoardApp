from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...schemas.column import ColumnCreate, ColumnUpdate, ColumnResponse
from ...services.column_service import ColumnService
from ...services.board_service import BoardService

router = APIRouter()

@router.get("/board/{board_id}", response_model=List[ColumnResponse])
def get_board_columns(board_id: int, db: Session = Depends(get_db)):
    # Перевірка чи існує дошка
    board = BoardService.get_board_by_id(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    return ColumnService.get_columns_by_board(db, board_id)

@router.post("/", response_model=ColumnResponse, status_code=status.HTTP_201_CREATED)
def create_column(column: ColumnCreate, db: Session = Depends(get_db)):
    # Перевірка чи існує дошка
    board = BoardService.get_board_by_id(db, column.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    return ColumnService.create_column(db, column)

@router.put("/{column_id}", response_model=ColumnResponse)
def update_column(column_id: int, column_update: ColumnUpdate, db: Session = Depends(get_db)):
    updated_column = ColumnService.update_column(db, column_id, column_update)
    if not updated_column:
        raise HTTPException(status_code=404, detail="Column not found")
    return updated_column

@router.delete("/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_column(column_id: int, db: Session = Depends(get_db)):
    success = ColumnService.delete_column(db, column_id)
    if not success:
        raise HTTPException(status_code=404, detail="Column not found")

@router.post("/board/{board_id}/reorder")
def reorder_columns(board_id: int, column_order: List[int], db: Session = Depends(get_db)):
    # Перевірка чи існує дошка
    board = BoardService.get_board_by_id(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    success = ColumnService.reorder_columns(db, board_id, column_order)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reorder columns")
    return {"message": "Columns reordered successfully"}