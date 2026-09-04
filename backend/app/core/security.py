"""
Security utilities — password hashing, JWT creation/validation,
and FastAPI dependency for protected endpoints.

Password hashing:   passlib + bcrypt
JWT:                python-jose (HS256 by default, configurable)

The secret key and algorithm are read from app.core.config.settings.
Never import or use JWT_SECRET_KEY directly in route handlers.
Always use the helpers and dependency defined here.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

logger = logging.getLogger(__name__)

# ── Password hashing ──────────────────────────────────────────────────────────

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of *plain_password*."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if *plain_password* matches *hashed_password*."""
    return _pwd_context.verify(plain_password, hashed_password)


# ── JWT creation ──────────────────────────────────────────────────────────────

def create_access_token(
    subject: str,
    role: str,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a signed JWT access token.

    Args:
        subject:       The value for the `sub` claim (typically username).
        role:          The user's role — embedded as a custom `role` claim.
        expires_delta: Optional override for token lifetime.
                       Falls back to settings.ACCESS_TOKEN_EXPIRE_MINUTES.

    Returns:
        Encoded JWT string.
    """
    from app.core.config import settings  # lazy to avoid circular imports

    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY or "",
        algorithm=settings.JWT_ALGORITHM,
    )


# ── JWT decoding ──────────────────────────────────────────────────────────────

def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT access token.

    Returns the payload dict on success.
    Raises JWTError on any validation failure (expired, bad signature, etc.).
    """
    from app.core.config import settings

    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY or "",
        algorithms=[settings.JWT_ALGORITHM],
    )


# ── OAuth2 scheme ─────────────────────────────────────────────────────────────

# tokenUrl must match the actual login endpoint.
_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ── get_current_user dependency ───────────────────────────────────────────────

async def get_current_user(
    token: str = Depends(_oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    FastAPI dependency that validates the Bearer token and returns the User.

    Usage in protected routes:
        current_user = Depends(get_current_user)

    Raises HTTP 401 if the token is missing, invalid, expired, or the user
    no longer exists in the database.
    """
    from app.models.user import User  # lazy — avoids circular import at module load

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        username: str | None = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception

    return user


# ── Role-based dependency factory ─────────────────────────────────────────────

def require_role(*roles: str):
    """
    Return a FastAPI dependency that enforces at least one of *roles*.

    Usage:
        teacher_only = Depends(require_role("teacher"))
        staff = Depends(require_role("teacher", "admin"))
    """
    async def _check_role(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"This endpoint requires one of the following roles: "
                    f"{sorted(roles)}."
                ),
            )
        return current_user
    return _check_role
