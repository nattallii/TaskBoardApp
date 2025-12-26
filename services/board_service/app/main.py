from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.v1 import boards, columns, tasks
import asyncpg  


app = FastAPI(title=settings.PROJECT_NAME)

# Налаштування CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Підключаємо роутери
app.include_router(boards.router, prefix="/api/v1/boards", tags=["boards"])
app.include_router(columns.router, prefix="/api/v1/columns", tags=["columns"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])

@app.get("/")
def read_root():
    return {"message": "TaskBoard Kanban Service is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}