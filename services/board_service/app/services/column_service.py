from sqlalchemy.orm import Session
from typing import List
from ..db.models.column import Column
from ..db.models.task import Task
from ..schemas.column import ColumnCreate, ColumnUpdate

class ColumnService:
    @staticmethod
    def get_columns_by_board(db: Session, board_id: int):
        return db.query(Column).filter(Column.board_id == board_id).order_by(Column.position).all()
    
    @staticmethod
    def create_column(db: Session, column: ColumnCreate):
        db_column = Column(**column.model_dump())
        db.add(db_column)
        db.commit()
        db.refresh(db_column)
        return db_column
    
    @staticmethod
    def update_column(db: Session, column_id: int, column_update: ColumnUpdate):
        db_column = db.query(Column).filter(Column.id == column_id).first()
        if not db_column:
            return None
        
        update_data = column_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_column, field, value)
        
        db.commit()
        db.refresh(db_column)
        return db_column
    
    @staticmethod
    def delete_column(db: Session, column_id: int):
        db_column = db.query(Column).filter(Column.id == column_id).first()
        if not db_column:
            return False
        
        db.delete(db_column)
        db.commit()
        return True
    
    @staticmethod
    def reorder_columns(db: Session, board_id: int, column_order: List[int]):
        columns = db.query(Column).filter(Column.board_id == board_id).all()
        column_dict = {col.id: col for col in columns}
        
        for position, column_id in enumerate(column_order):
            if column_id in column_dict:
                column_dict[column_id].position = position
        
        db.commit()
        return True