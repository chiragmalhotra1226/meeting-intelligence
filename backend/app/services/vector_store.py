import logging
import google.generativeai as genai
from app.config import get_settings
from app.services.supabase_client import get_supabase

logger = logging.getLogger("meeting-intelligence.vector")

EMBEDDING_MODEL = "models/text-embedding-004"
EMBEDDING_DIM = 384  # Matches existing Supabase pgvector schema


class VectorStore:
    def __init__(self):
        self.settings = get_settings()
        self._configured = False

    async def initialize(self):
        genai.configure(api_key=self.settings.gemini_api_key)
        self._configured = True
        logger.info("Gemini embedding API configured")

    def _embed(self, texts: list[str]) -> list[list[float]]:
        if not self._configured:
            raise RuntimeError("VectorStore not initialized. Call initialize() first.")
        embeddings = []
        for text in texts:
            result = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=text,
                output_dimensionality=EMBEDDING_DIM,
            )
            embeddings.append(result["embedding"])
        return embeddings

    def _chunk_text(self, text: str) -> list[str]:
        size = self.settings.chunk_size
        overlap = self.settings.chunk_overlap
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + size, len(text))
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start += size - overlap
        return chunks

    async def index_transcript(self, meeting_id: str, transcript: str):
        chunks = self._chunk_text(transcript)
        if not chunks:
            logger.warning(f"No chunks to index for meeting {meeting_id}")
            return

        logger.info(f"Indexing {len(chunks)} chunks for meeting {meeting_id}")
        embeddings = self._embed(chunks)

        sb = get_supabase()
        rows = [
            {
                "meeting_id": meeting_id,
                "content": chunk,
                "embedding": emb,
                "chunk_index": i,
            }
            for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
        ]

        try:
            sb.table("meeting_embeddings").insert(rows).execute()
            logger.info(f"Indexed {len(rows)} embeddings for meeting {meeting_id}")
        except Exception as e:
            logger.error(f"Failed to insert embeddings: {e}")
            raise

    async def search(self, query: str, user_id: str, limit: int = 5) -> list[dict]:
        query_vec = self._embed([query])[0]
        sb = get_supabase()

        try:
            result = sb.rpc(
                "match_meeting_embeddings",
                {
                    "query_embedding": query_vec,
                    "match_count": limit,
                    "filter_user_id": user_id,
                },
            ).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            raise
