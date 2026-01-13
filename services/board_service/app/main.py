from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.v1 import boards, columns, tasks
import asyncpg  

from prometheus_fastapi_instrumentator import Instrumentator  # Додати цей імпорт


app = FastAPI(title='board service',)

Instrumentator().instrument(app).expose(app)  # Додати ці два рядки

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(boards.router, prefix="/api/v1/boards", tags=["boards"])
app.include_router(columns.router, prefix="/api/v1/columns", tags=["columns"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])

@app.get("/")
def read_root():
    return {"message": "TaskBoard Kanban Service is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/health/live")
def live():
    return {"status": "ok"}

@app.get("/health/ready")
def ready():
    return {"status": "ready"}