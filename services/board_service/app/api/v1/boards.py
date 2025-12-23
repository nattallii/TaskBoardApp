from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.schemas.board import BoardCreate, BoardUpdate, BoardResponse, BoardListResponse
from app.services.board_service import BoardService

router = APIRouter()

@router.get("/", response_model=BoardListResponse)
async def get_boards(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    owner_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    boards, total = await BoardService.get_boards(db, skip, limit, owner_id)
    return BoardListResponse(boards=boards, total=total)

@router.get("/{board_id}", response_model=BoardResponse)
async def get_board(board_id: int, db: AsyncSession = Depends(get_db)):
    board = await BoardService.get_board_by_id(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board

@router.post("/", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
async def create_board(
    board: BoardCreate,
    owner_id: int = 1,
    db: AsyncSession = Depends(get_db),
):
    return await BoardService.create_board(db, board, owner_id)

@router.put("/{board_id}", response_model=BoardResponse)
async def update_board(
    board_id: int,
    board_update: BoardUpdate,
    db: AsyncSession = Depends(get_db),
):
    board = await BoardService.update_board(db, board_id, board_update)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board

@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(board_id: int, db: AsyncSession = Depends(get_db)):
    success = await BoardService.delete_board(db, board_id)
    if not success:
        raise HTTPException(status_code=404, detail="Board not found")
