from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
from datetime import datetime, timezone
import logging

from app.api.auth import get_user_id
from app.services.supabase_client import get_supabase
from app.services.ai_engine import AIEngine
from app.core.security import (
    validate_session_id,
    validate_transcript_length,
    validate_title,
    sanitize_chunk_text,
)

router = APIRouter()
logger = logging.getLogger("meeting-intelligence.meetings")


# ── Request Schemas ──────────────────────────────────────────────────────────

class CreateMeeting(BaseModel):
    title: str
    capture_source: str = "web_speech_api"


class SaveTranscript(BaseModel):
    session_id: str
    chunks: list[dict]


class RAGQuery(BaseModel):
    query: str
    limit: int = 5


class AnalyzeRequest(BaseModel):
    session_id: str
    transcript: str


# ── Meeting CRUD ─────────────────────────────────────────────────────────────

@router.post("/create")
async def create_meeting(body: CreateMeeting, user_id: str = Depends(get_user_id)):
    """Create a new meeting session. Returns the session_id for WebSocket streaming."""
    title = validate_title(body.title)
    sb = get_supabase()
    session_id = str(uuid4())

    row = {
        "id": session_id,
        "user_id": user_id,
        "title": title,
        "capture_source": body.capture_source,
        "status": "recording",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        sb.table("meetings").insert(row).execute()
    except Exception as e:
        logger.error(f"Failed to create meeting: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")

    return {"session_id": session_id, "title": title}


@router.get("/list")
async def list_meetings(user_id: str = Depends(get_user_id)):
    """List all meetings for the authenticated user, newest first."""
    sb = get_supabase()
    try:
        res = (
            sb.table("meetings")
            .select("id, title, status, capture_source, summary, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Failed to list meetings: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")


@router.get("/{session_id}")
async def get_meeting(session_id: str, user_id: str = Depends(get_user_id)):
    """Get a single meeting with its transcript chunks and action items."""
    validate_session_id(session_id)
    sb = get_supabase()

    try:
        res = (
            sb.table("meetings")
            .select("*, transcript_chunks(*), action_items(*)")
            .eq("id", session_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(404, "Meeting not found")

    if not res.data:
        raise HTTPException(404, "Meeting not found")
    return res.data


# ── Transcript Persistence ───────────────────────────────────────────────────

@router.post("/save-chunks")
async def save_chunks(body: SaveTranscript, user_id: str = Depends(get_user_id)):
    """Persist interim transcript chunks from the Web Speech stream (HTTP fallback)."""
    sb = get_supabase()
    rows = []
    for i, c in enumerate(body.chunks):
        text = sanitize_chunk_text(c.get("text", ""))
        if not text.strip():
            continue
        rows.append({
            "meeting_id": body.session_id,
            "chunk_index": i,
            "speaker_label": c.get("speaker", "UNKNOWN"),
            "text": text,
            "time_offset": c.get("time_offset", 0),
            "confidence": c.get("confidence", 1.0),
        })

    if not rows:
        return {"saved": 0}

    try:
        sb.table("transcript_chunks").insert(rows).execute()
    except Exception as e:
        logger.error(f"Failed to save chunks: {e}")
        raise HTTPException(500, f"Chunk save failed: {str(e)}")

    return {"saved": len(rows)}


@router.post("/beacon")
async def beacon_save(request: Request):
    """
    Emergency save via navigator.sendBeacon() on tab close.
    No auth header (beacons can't set headers) — accepts raw POST body.
    """
    try:
        data = await request.json()
    except Exception:
        return {"ok": False, "error": "Invalid JSON"}

    session_id = data.get("session_id")
    text = data.get("text", "").strip()

    if not session_id or not text:
        return {"ok": False, "error": "Missing session_id or text"}

    try:
        sb = get_supabase()
        sb.table("transcript_chunks").insert({
            "meeting_id": session_id,
            "chunk_index": -1,  # Sentinel: beacon recovery chunk
            "speaker_label": "BEACON_RECOVERY",
            "text": sanitize_chunk_text(text),
            "time_offset": 0,
            "confidence": 0.5,
        }).execute()
        return {"ok": True}
    except Exception as e:
        logger.error(f"Beacon save failed: {e}")
        return {"ok": False, "error": str(e)}


# ── AI Analysis ──────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_meeting(
    body: AnalyzeRequest,
    request: Request,
    user_id: str = Depends(get_user_id),
):
    """
    Run full LLM analysis on a transcript:
    - Executive summary
    - Speaker diarization
    - Topic timeline
    - Action items extraction
    - Conductor coaching report
    Then index embeddings for RAG search.
    """
    validate_transcript_length(body.transcript)

    engine = AIEngine()

    try:
        result = await engine.full_analysis(body.transcript)
    except Exception as e:
        logger.error(f"LLM analysis failed: {e}")
        raise HTTPException(502, f"AI analysis failed: {str(e)}")

    # ── Persist results ──────────────────────────────────────────
    sb = get_supabase()

    try:
        sb.table("meetings").update({
            "status": "analyzed",
            "summary": result.get("executive_summary", ""),
            "speakers": result.get("inferred_speakers", []),
            "topic_timeline": result.get("topic_timeline", []),
            "coaching": result.get("conductor_coaching", {}),
            "full_transcript": body.transcript,  # ← add this
        }).eq("id", body.session_id).execute()
    except Exception as e:
        logger.warning(f"Failed to save analysis to DB: {e}")

    # ── Save action items ────────────────────────────────────────
    for item in result.get("action_items", []):
        try:
            sb.table("action_items").insert({
                "meeting_id": body.session_id,
                "task_description": item.get("action_description", ""),
                "assigned_to": item.get("assigned_to", "Unassigned"),
                "deadline": item.get("implied_deadline"),
                "status": "pending",
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save action item: {e}")

    # ── Index embeddings for RAG ─────────────────────────────────
    vs = getattr(request.app.state, "vector_store", None)
    if vs:
        try:
            await vs.index_transcript(body.session_id, body.transcript)
            logger.info(f"Indexed embeddings for session {body.session_id}")
        except Exception as e:
            logger.warning(f"Embedding indexing failed: {e}")

    return result


# ── RAG Search ───────────────────────────────────────────────────────────────

@router.post("/rag-query")
async def rag_query(
    body: RAGQuery,
    request: Request,
    user_id: str = Depends(get_user_id),
):
    """Semantic search across all user meetings using pgvector."""
    vs = getattr(request.app.state, "vector_store", None)
    if not vs:
        raise HTTPException(503, "Vector store not initialized. RAG search unavailable.")

    try:
        chunks = await vs.search(body.query, user_id, body.limit)
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        raise HTTPException(502, f"Search failed: {str(e)}")

    engine = AIEngine()

    try:
        answer = await engine.rag_answer(body.query, chunks)
    except Exception as e:
        logger.error(f"RAG answer generation failed: {e}")
        raise HTTPException(502, f"Answer generation failed: {str(e)}")

    return {"answer": answer, "sources": chunks}


# ── File Upload ──────────────────────────────────────────────────────────────

@router.post("/upload-media")
async def get_upload_url(user_id: str = Depends(get_user_id)):
    """
    Generate a storage path for Supabase Storage direct upload.
    The frontend uploads directly to Supabase Storage using the anon key.
    """
    file_key = f"{user_id}/{uuid4()}"
    return {
        "storage_path": file_key,
        "bucket": "meeting-media",
    }