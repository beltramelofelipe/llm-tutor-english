"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.models.database import create_tables
from app.routers import chat, vocabulary, progress


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and temp audio directory on startup."""
    settings = get_settings()
    os.makedirs(settings.temp_audio_dir, exist_ok=True)
    create_tables()
    yield


app = FastAPI(
    title="English Tutor AI",
    description="AI-powered voice English tutor for Brazilian Portuguese speakers",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated TTS audio files
app.mount("/api/audio", StaticFiles(directory=settings.temp_audio_dir), name="audio")

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(vocabulary.router, prefix="/api/vocabulary", tags=["vocabulary"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "English Tutor AI"}
