import json
import httpx
import logging
from app.config import get_settings
from app.core.prompts import (
    FULL_ANALYSIS_SYSTEM,
    RAG_ANSWER_SYSTEM,
    SEMANTIC_REPAIR_SYSTEM,
    TOPIC_CLASSIFICATION_SYSTEM,
)
from app.core.security import scrub_pii

logger = logging.getLogger("meeting-intelligence.ai")


class AIEngine:
    def __init__(self):
        self.settings = get_settings()

    async def _call_groq(
        self, system: str, user_msg: str, model: str = "llama-3.3-70b-versatile"
    ) -> str:
        if not self.settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY not set in .env")

        async with httpx.AsyncClient(timeout=90.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.settings.groq_api_key}"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user_msg},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 4096,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def _call_gemini(self, system: str, user_msg: str) -> str:
        if not self.settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY not set in .env")

        async with httpx.AsyncClient(timeout=90.0) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"gemini-2.0-flash:generateContent?key={self.settings.gemini_api_key}",
                json={
                    "system_instruction": {"parts": [{"text": system}]},
                    "contents": [{"parts": [{"text": user_msg}]}],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 4096,
                    },
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    async def _infer(self, system: str, user_msg: str) -> str:
        """Route to configured LLM provider with PII scrubbing."""
        clean = scrub_pii(user_msg)
        logger.info(f"LLM call via {self.settings.llm_provider} ({len(clean)} chars)")

        if self.settings.llm_provider == "gemini":
            return await self._call_gemini(system, clean)
        return await self._call_groq(system, clean)

    def _parse_json(self, raw: str) -> dict:
        text = raw.strip()

        # Extract JSON from markdown fences or surrounding text
        import re
        # Try to find JSON block in ```json ... ``` or ``` ... ```
        fence_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
        if fence_match:
            text = fence_match.group(1).strip()
        else:
            # Try to find raw JSON object
            brace_match = re.search(r'\{.*\}', text, re.DOTALL)
            if brace_match:
                text = brace_match.group(0).strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse failed: {e}\nRaw output:\n{text[:500]}")
            return {
                "executive_summary": text[:500],
                "inferred_speakers": [],
                "topic_timeline": [],
                "action_items": [],
                "conductor_coaching": {
                    "engagement_score": 0, "monologue_percentage": 0,
                    "strengths": [], "improvement_areas": ["LLM response parsing failed"],
                },
            }

    async def full_analysis(self, transcript: str) -> dict:
        """Run complete meeting analysis: summary, speakers, topics, actions, coaching."""
        raw = await self._infer(FULL_ANALYSIS_SYSTEM, transcript)
        return self._parse_json(raw)

    async def rag_answer(self, query: str, context_chunks: list[dict]) -> str:
        """Generate a cited answer from RAG context chunks."""
        if not context_chunks:
            return "No relevant context found across your meetings for this query."

        ctx = "\n\n".join(
            f"[Meeting {c.get('meeting_id', 'unknown')[:8]}]: {c.get('content', '')}"
            for c in context_chunks
        )
        prompt = f"Context:\n{ctx}\n\nQuestion: {query}"
        return await self._infer(RAG_ANSWER_SYSTEM, prompt)

    async def classify_topic(self, text: str) -> str:
        """Classify a transcript segment into a short topic label."""
        return (await self._infer(TOPIC_CLASSIFICATION_SYSTEM, text)).strip()

    async def repair_transcript(self, text: str) -> str:
        """Fix speech-to-text errors using semantic context."""
        return await self._infer(SEMANTIC_REPAIR_SYSTEM, text)