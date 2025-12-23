from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, DateTime, func, Column

from app.db.base import Base


class UserProfile(Base):
    __tablename__ = 'user_profile'
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    bio: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user_id: Mapped[int] = mapped_column(unique=True, index=True, nullable=False)
