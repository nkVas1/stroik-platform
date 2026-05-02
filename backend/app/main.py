import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import chat, users, projects, auth, reviews

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s\t%(name)s\t%(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Stroik API",
    description="API для строительной платформы СТРОИК",
    version="0.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(auth.router)
app.include_router(reviews.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Stroik Core API", "version": "0.3.0"}
