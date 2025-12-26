from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://boarduser:boardpass@board_db:5432/boarddb",
        description="Database connection URL. For Docker use board_db hostname"
    )
    
    # API settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "TaskBoard Kanban Service"
    
    # JWT settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Дозволяє використовувати окремі .env файли для різних середовищ
        case_sensitive = True

settings = Settings()