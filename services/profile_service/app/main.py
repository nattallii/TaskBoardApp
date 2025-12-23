from fastapi import FastAPI
from app.api.v1.router import router as profile_router


app = FastAPI(title="Profile Service")

app.include_router(profile_router, prefix='/api/v1')