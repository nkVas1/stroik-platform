import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.database import engine
from app.routers import chat, users, projects, auth, reviews
from app.routers.portfolio import router as portfolio_router
from app.routers.verification import router as verification_router
from app.routers.subscriptions import router as subscriptions_router
from app.routers.workers import router as workers_router

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s\t%(name)s\t%(message)s"
)
logger = logging.getLogger(__name__)

_start_time = time.time()

app = FastAPI(
    title="Stroik API",
    description="API для строительной платформы СТРОИК",
    version="0.5.1"
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
app.include_router(workers_router)


@app.get("/health", tags=["system"])
async def health_check():
    """
    Lightweight liveness + DB connectivity probe.
    Used by Render health checks and UptimeRobot keep-alive pings.
    Returns 200 when the API is up and the DB is reachable.
    """
    db_ok = False
    db_error: str | None = None
    try:
        async with engine.connect() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        db_error = str(exc)
        logger.warning("Health check DB probe failed: %s", exc)

    uptime_seconds = round(time.time() - _start_time)

    payload = {
        "status": "ok" if db_ok else "degraded",
        "service": "Stroik Core API",
        "version": "0.5.1",
        "uptime_seconds": uptime_seconds,
        "db": "ok" if db_ok else f"error: {db_error}",
    }

    if not db_ok:
        from fastapi import Response
        import json
        return Response(
            content=json.dumps(payload),
            status_code=503,
            media_type="application/json",
        )

    return payload
