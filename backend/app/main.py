from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic_settings import BaseSettings
from functools import lru_cache

# ── Dynamic Routers and Vectors Store Imports ─────────────────────────
from app.api import meetings, websockets, auth
from app.services.vector_store import VectorStore


# ── Configuration Management Settings Engine ──────────────────────────
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


# ── Server Startup & Context Application Lifespan ────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load embedding model on server startup context loop
    vs = VectorStore()
    await vs.initialize()
    app.state.vector_store = vs
    yield


# ── Application Factory Initializer ──────────────────────────────────
app = FastAPI(
    title="Meeting Intelligence API",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

# ── Global CORS Middleware Engine ─────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Explicit Router Inclusion Matrix ─────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(meetings.router, prefix="/api/meetings", tags=["meetings"])
app.include_router(websockets.router, prefix="/api/ws", tags=["websocket"])


# ── Global Baseline Health Routes ─────────────────────────────────────
@app.get("/")
@app.get("/health")
async def health():
    return {"status": "ok", "service": "meeting-intelligence"}