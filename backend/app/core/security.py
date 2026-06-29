import re
import logging
from fastapi import HTTPException

logger = logging.getLogger("meeting-intelligence.security")

# ── PII Scrubbing ────────────────────────────────────────────────────────────
# Patterns to redact before sending transcripts to LLM APIs
PII_PATTERNS = [
    # Phone numbers (US/IN formats)
    (r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE_REDACTED]'),
    (r'\b\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b', '[PHONE_REDACTED]'),
    # SSN
    (r'\b\d{3}[-]?\d{2}[-]?\d{4}\b', '[SSN_REDACTED]'),
    # Email addresses
    (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]'),
    # Credit card numbers
    (r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b', '[CARD_REDACTED]'),
    # Aadhaar (India)
    (r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[AADHAAR_REDACTED]'),
]


def scrub_pii(text: str) -> str:
    """Remove personally identifiable information before LLM processing."""
    scrubbed = text
    for pattern, replacement in PII_PATTERNS:
        scrubbed = re.sub(pattern, replacement, scrubbed)
    return scrubbed


# ── Input Validation ─────────────────────────────────────────────────────────

UUID_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    re.IGNORECASE,
)


def validate_session_id(session_id: str) -> None:
    """Ensure session_id is a valid UUID v4."""
    if not UUID_PATTERN.match(session_id):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid session ID format. Expected UUID, got: {session_id[:50]}",
        )


MAX_TRANSCRIPT_CHARS = 500_000  # ~125K words, ~2 hours of dense meeting


def validate_transcript_length(text: str) -> None:
    """Reject transcripts that exceed safe processing limits."""
    if len(text) > MAX_TRANSCRIPT_CHARS:
        raise HTTPException(
            status_code=413,
            detail=f"Transcript too large: {len(text):,} chars (max {MAX_TRANSCRIPT_CHARS:,}). "
                   f"Split into multiple sessions.",
        )


MAX_TITLE_LENGTH = 200


def validate_title(title: str) -> str:
    """Sanitize meeting titles."""
    cleaned = title.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Meeting title cannot be empty")
    if len(cleaned) > MAX_TITLE_LENGTH:
        cleaned = cleaned[:MAX_TITLE_LENGTH]
        logger.warning(f"Title truncated to {MAX_TITLE_LENGTH} chars")
    return cleaned


def sanitize_chunk_text(text: str) -> str:
    """Basic sanitization for transcript chunks — strip control chars."""
    # Remove null bytes and other control characters (keep newlines/tabs)
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)