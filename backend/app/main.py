import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.routers import chat, users, projects, auth, reviews
from app.routers.portfolio import router as portfolio_router
from app.routers.verification import router as verification_router
from app.routers.subscriptions import router as subscriptions_router

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s\t%(name)s\t%(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Stroik API",
    description="API для строительной платформы СТРОИК",
    version="0.4.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files statically
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(chat.router)
app.include_router(reviews.router)
app.include_router(portfolio_router)
app.include_router(verification_router)
app.include_router(subscriptions_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Stroik Core API", "version": "0.4.1"}
