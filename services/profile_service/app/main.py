from fastapi import FastAPI
from app.api.v1.router import router as profile_router
from contextlib import asynccontextmanager, suppress
import asyncio
from app.messaging.consumer import consume_profiles

from prometheus_fastapi_instrumentator import Instrumentator  # Додати цей імпорт


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(consume_profiles())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task

app = FastAPI(title="Profile Service", lifespan=lifespan)

Instrumentator().instrument(app).expose(app)  # Додати ці два рядки

app.include_router(profile_router, prefix='/api/v1')

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/health/live")
def live():
    return {"status": "ok"}

@app.get("/health/ready")
def ready():
    return {"status": "ready"}