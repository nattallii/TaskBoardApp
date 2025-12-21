from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.schemas.board import BoardCreate, BoardUpdate, BoardResponse, BoardListResponse
from app.services.board_service import BoardService

router = APIRouter()

@router.get("/", response_model=BoardListResponse)
def get_boards(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    owner_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    boards, total = BoardService.get_boards(db, skip, limit, owner_id)
    return BoardListResponse(boards=boards, total=total)

@router.get("/{board_id}", response_model=BoardResponse)
def get_board(board_id: int, db: Session = Depends(get_db)):
    board = BoardService.get_board_by_id(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board

@router.post("/", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
def create_board(board: BoardCreate, owner_id: int = 1, db: Session = Depends(get_db)):
    return BoardService.create_board(db, board, owner_id)

@router.put("/{board_id}", response_model=BoardResponse)
def update_board(board_id: int, board_update: BoardUpdate, db: Session = Depends(get_db)):
    updated_board = BoardService.update_board(db, board_id, board_update)
    if not updated_board:
        raise HTTPException(status_code=404, detail="Board not found")
    return updated_board

@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(board_id: int, db: Session = Depends(get_db)):
    success = BoardService.delete_board(db, board_id)
    if not success:
        raise HTTPException(status_code=404, detail="Board not found")