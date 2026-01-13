from fastapi import FastAPI
from app.api.v1.router import router as profile_router
from contextlib import asynccontextmanager, suppress
import asyncio
from app.messaging.consumer import consume_profiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(consume_profiles())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task

app = FastAPI(title="Profile Service", lifespan=lifespan, root_path='/profile')

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
