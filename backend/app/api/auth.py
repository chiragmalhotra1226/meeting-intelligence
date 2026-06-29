from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional
import httpx
import logging
from functools import lru_cache
from app.config import get_settings

router = APIRouter()
security = HTTPBearer(auto_error=False)
settings = get_settings()
logger = logging.getLogger("meeting-intelligence.auth")


@lru_cache()
def get_jwks() -> dict:
    """Fetch Supabase JWKS public keys for ES256 verification."""
    url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    resp = httpx.get(url, timeout=10)
    resp.raise_for_status()
    return resp.json()


def verify_es256_token(token: str) -> dict:
    """Verify an ES256-signed Supabase JWT using JWKS."""
    jwks = get_jwks()
    # Extract the key ID from token header
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")

    # Find matching key
    rsa_key = {}
    for key in jwks.get("keys", []):
        if key["kid"] == kid:
            rsa_key = key
            break

    if not rsa_key:
        raise JWTError(f"No matching key found for kid: {kid}")

    payload = jwt.decode(
        token,
        rsa_key,
        algorithms=["ES256"],
        audience="authenticated",
    )
    return payload


async def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = credentials.credentials

    # Try ES256 with JWKS (new Supabase projects)
    try:
        return verify_es256_token(token)
    except Exception as e:
        logger.debug(f"ES256 verification failed: {e}")

    # Fallback: try HS256 with JWT secret
    if settings.jwt_secret:
        try:
            return jwt.decode(
                token, settings.jwt_secret,
                algorithms=["HS256"], audience="authenticated",
            )
        except JWTError:
            pass

    raise HTTPException(status_code=401, detail="Token verification failed")


async def get_user_id(token: dict = Depends(verify_token)) -> str:
    uid = token.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="No user ID in token")
    return uid


@router.get("/me")
async def me(user: dict = Depends(verify_token)):
    return {
        "user_id": user.get("sub"),
        "email": user.get("email"),
        "role": user.get("role"),
    }