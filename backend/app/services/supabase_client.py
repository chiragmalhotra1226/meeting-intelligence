from supabase import create_client, Client
from functools import lru_cache
import logging
from app.config import get_settings

logger = logging.getLogger("meeting-intelligence.supabase")


@lru_cache()
def get_supabase() -> Client:
    """
    Singleton Supabase client using the SERVICE ROLE key.
    
    The service role key bypasses Row Level Security (RLS), which is needed
    because backend endpoints authenticate via JWT middleware — RLS
    would double-gate requests and break WebSocket chunk saves.
    
    NEVER expose the service role key to the frontend.
    """
    s = get_settings()

    if not s.supabase_url or not s.supabase_service_key:
        logger.error(
            "Supabase not configured! Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env"
        )
        raise RuntimeError(
            "Supabase credentials missing. "
            "Add SUPABASE_URL and SUPABASE_SERVICE_KEY to backend/.env"
        )

    client = create_client(s.supabase_url, s.supabase_service_key)
    logger.info(f"Supabase client initialized for {s.supabase_url}")
    return client