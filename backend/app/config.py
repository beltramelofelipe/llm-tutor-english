"""Application configuration using pydantic-settings."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    groq_api_key: str = ""
    openai_api_key: str = ""
    database_url: str = "sqlite:///./english_tutor.db"
    edge_tts_voice: str = "en-US-AriaNeural"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    max_conversation_history: int = 20
    temp_audio_dir: str = "temp_audio"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
