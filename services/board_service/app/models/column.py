from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Column(Base):
    __tablename__ = "columns"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"))
    
    board = relationship("Board", back_populates="columns")
    tasks = relationship("Task", back_populates="column", cascade="all, delete-orphan", order_by="Task.position", lazy="selectin")