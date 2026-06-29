import logging
from sentence_transformers import SentenceTransformer
from app.config import get_settings
from app.services.supabase_client import get_supabase

logger = logging.getLogger("meeting-intelligence.vector")


class VectorStore:
    def __init__(self):
        self.model: SentenceTransformer | None = None
        self.settings = get_settings()

    async def initialize(self):
        """
        Load the embedding model. This downloads ~80MB on first run.
        all-MiniLM-L6-v2 outputs 384-dimensional vectors.
        """
        logger.info(f"Loading embedding model: {self.settings.embedding_model}")
        self.model = SentenceTransformer(self.settings.embedding_model)
        logger.info("Embedding model loaded successfully")

    def _chunk_text(self, text: str) -> list[str]:
        """
        Split text using overlapping sliding window.
        500 chars with 100 char overlap ensures context continuity.
        """
        size = self.settings.chunk_size
        overlap = self.settings.chunk_overlap
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + size, len(text))
            chunk = text[start:end].strip()
            if chunk:  # Skip empty chunks
                chunks.append(chunk)
            start += size - overlap
        return chunks

    def _embed(self, texts: list[str]) -> list[list[float]]:
        """Generate normalized embeddings for a list of texts."""
        if not self.model:
            raise RuntimeError("Embedding model not initialized. Call initialize() first.")
        embeddings = self.model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()

    async def index_transcript(self, meeting_id: str, transcript: str):
        """
        Chunk a transcript and store embeddings in Supabase pgvector.
        Called after LLM analysis completes.
        """
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

    async def search(
        self, query: str, user_id: str, limit: int = 5
    ) -> list[dict]:
        """
        Semantic search across all user meetings via cosine similarity.
        Uses the match_meeting_embeddings Postgres function defined in schema.sql.
        """
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