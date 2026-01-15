from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import router as v1_router
from app.messaging.rabbitmq import rabbitmq



@asynccontextmanager
async def lifespan(app: FastAPI):
    await rabbitmq.connect()
    yield
    await rabbitmq.close()
app = FastAPI(title="Auth Service", lifespan=lifespan, root_path='/auth')

allowed_origins = [
    "http://localhost:4173",
    "http://localhost:4174",
    "http://localhost:5173",
    "http://127.0.0.1:4173",
    "http://127.0.0.1:4174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:64062",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/live")
def live():
    return {"status": "ok"}

@app.get("/health/ready")
def ready():
    return {"status": "ready"}
