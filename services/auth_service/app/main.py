from contextlib import asynccontextmanager

from fastapi import FastAPI
from app.api.v1.router import router as v1_router
from app.messaging.rabbitmq import rabbitmq



@asynccontextmanager
async def lifespan(app: FastAPI):
    await rabbitmq.connect()
    yield
    await rabbitmq.close()
app = FastAPI(title="Auth Service", lifespan=lifespan)

app.include_router(v1_router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"status": "ok"}

