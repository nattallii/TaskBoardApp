from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.models.board import Board
from app.schemas.board import BoardCreate, BoardUpdate

class BoardService:
    @staticmethod
    def get_boards(db: Session, skip: int = 0, limit: int = 100, owner_id: Optional[int] = None):
        query = db.query(Board)
        
        if owner_id:
            query = query.filter(Board.owner_id == owner_id)
        
        total = query.count()
        boards = query.offset(skip).limit(limit).all()
        
        return boards, total
    
    @staticmethod
    def get_board_by_id(db: Session, board_id: int):
        return db.query(Board).filter(Board.id == board_id).first()
    
    @staticmethod
    def create_board(db: Session, board: BoardCreate, owner_id: int):
        db_board = Board(
            title=board.title,
            description=board.description,
            owner_id=owner_id
        )
        db.add(db_board)
        db.commit()
        db.refresh(db_board)
        return db_board
    
    @staticmethod
    def update_board(db: Session, board_id: int, board_update: BoardUpdate):
        db_board = db.query(Board).filter(Board.id == board_id).first()
        if not db_board:
            return None
        
        update_data = board_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_board, field, value)
        
        db.commit()
        db.refresh(db_board)
        return db_board
    
    @staticmethod
    def delete_board(db: Session, board_id: int):
        db_board = db.query(Board).filter(Board.id == board_id).first()
        if not db_board:
            return False
        
        db.delete(db_board)
        db.commit()
        return True