from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # ── Supabase ─────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # ── LLM Providers ────────────────────────────────────────────
    groq_api_key: str = ""
    gemini_api_key: str = ""
    llm_provider: str = "groq"  # "groq" or "gemini"

    # ── Auth ─────────────────────────────────────────────────────
    jwt_secret: str = ""

    # ── App Config ───────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    embedding_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 500
    chunk_overlap: int = 100

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Don't crash on unknown env vars


@lru_cache()
def get_settings() -> Settings:
    return Settings()