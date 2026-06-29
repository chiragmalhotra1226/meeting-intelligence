from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
import json
import logging

from app.config import get_settings
from app.services.supabase_client import get_supabase

router = APIRouter()
settings = get_settings()
logger = logging.getLogger("meeting-intelligence.ws")


@router.websocket("/stream/{session_id}")
async def stream_transcript(ws: WebSocket, session_id: str):
    """
    Real-time WebSocket for streaming Web Speech API transcript chunks.

    Protocol:
    1. Client connects to /api/ws/stream/{session_id}
    2. First message MUST be auth: {"token": "<supabase_access_token>"}
    3. Server responds: {"status": "authenticated", "session_id": "..."}
    4. Client streams chunks: {"type": "chunks", "chunks": [{text, speaker, time_offset, confidence, pitch_delta}]}
    5. Server acknowledges: {"ack": <total_count>, "saved": <batch_count>}
    6. Client ends session: {"type": "end"}
    7. Server responds: {"status": "session_ended"} and closes
    """
    await ws.accept()
    user_id = None
    authenticated = False

    try:
        # ── Step 1: Authenticate ─────────────────────────────────
        raw_auth = await ws.receive_text()
        auth_data = json.loads(raw_auth)
        token = auth_data.get("token", "")

        if not settings.jwt_secret:
            # Dev mode: skip auth
            user_id = "dev-user"
            authenticated = True
            logger.warning("WebSocket auth skipped — JWT_SECRET not configured")
        else:
            try:
                payload = jwt.decode(
                    token,
                    settings.jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
                user_id = payload.get("sub")
                authenticated = True
            except JWTError as e:
                await ws.send_json({"error": f"Authentication failed: {str(e)}"})
                await ws.close(code=4001)
                return

        if not authenticated:
            await ws.send_json({"error": "unauthorized"})
            await ws.close(code=4001)
            return

        await ws.send_json({
            "status": "authenticated",
            "session_id": session_id,
            "user_id": user_id,
        })

        # ── Step 2: Stream chunks ────────────────────────────────
        sb = get_supabase()
        chunk_counter = 0

        while True:
            raw = await ws.receive_text()

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_json({"error": "Invalid JSON"})
                continue

            msg_type = data.get("type", "")

            if msg_type == "chunks":
                chunks = data.get("chunks", [])
                if not chunks:
                    await ws.send_json({"ack": chunk_counter, "saved": 0})
                    continue

                rows = []
                for c in chunks:
                    rows.append({
                        "meeting_id": session_id,
                        "chunk_index": chunk_counter,
                        "speaker_label": c.get("speaker", "UNKNOWN"),
                        "text": c.get("text", ""),
                        "time_offset": c.get("time_offset", 0),
                        "confidence": c.get("confidence", 1.0),
                        "pitch_delta": c.get("pitch_delta"),
                    })
                    chunk_counter += 1

                try:
                    sb.table("transcript_chunks").insert(rows).execute()
                except Exception as e:
                    logger.error(f"Failed to save chunks: {e}")
                    # Don't crash the WS — just report the error
                    await ws.send_json({"warning": f"Save failed: {str(e)}", "ack": chunk_counter})
                    continue

                await ws.send_json({"ack": chunk_counter, "saved": len(rows)})

            elif msg_type == "end":
                try:
                    sb.table("meetings").update(
                        {"status": "completed"}
                    ).eq("id", session_id).execute()
                except Exception as e:
                    logger.error(f"Failed to update meeting status: {e}")

                await ws.send_json({"status": "session_ended", "total_chunks": chunk_counter})
                break

            elif msg_type == "ping":
                await ws.send_json({"type": "pong"})

            else:
                await ws.send_json({"error": f"Unknown message type: {msg_type}"})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: session={session_id}, user={user_id}")
        if user_id and session_id:
            try:
                sb = get_supabase()
                sb.table("meetings").update(
                    {"status": "interrupted"}
                ).eq("id", session_id).execute()
            except Exception:
                pass

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await ws.send_json({"error": str(e)})
            await ws.close(code=1011)
        except Exception:
            pass