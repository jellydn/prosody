from contextlib import asynccontextmanager
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import init_db
from app.api.progress import router as progress_router
from app.api.analyze import router as analyze_router
from app import worker


def _configure_logging() -> None:
    raw_log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, raw_log_level, logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )


def _parse_cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:8081,http://localhost:19006,http://localhost:3000",
    )
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["http://localhost:8081"]


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    worker.startup()
    yield
    worker.shutdown()


app = FastAPI(
    title="English Rhythm Coach API",
    description="Backend API for English Rhythm Coach mobile application",
    version="0.1.0",
    lifespan=lifespan,
)

_configure_logging()

cors_origins = _parse_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(progress_router)
app.include_router(analyze_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
