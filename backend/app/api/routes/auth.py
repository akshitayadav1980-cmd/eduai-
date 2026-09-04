"""
Authentication router — /api/v1/auth

Endpoints:
    GET  /api/v1/auth/status    — health check (no auth required)
    POST /api/v1/auth/register  — create a new user account
    POST /api/v1/auth/login     — obtain a JWT access token
    GET  /api/v1/auth/me        — return the current user's profile (requires token)
    POST /api/v1/auth/logout    — stateless logout guidance

JWT lifecycle:
    Tokens are stateless (HS256 signed).  On logout the token cannot be
    server-side invalidated without a token-blocklist (e.g. Redis).  The
    client is responsible for discarding the token on logout.  A blocklist
    can be added in a future step if required.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LogoutResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Status ────────────────────────────────────────────────────────────────────

@router.get(
    "/status",
    summary="Auth module status",
    response_description="Confirms the auth module is reachable.",
)
def auth_status() -> dict[str, str]:
    """Architecture verification endpoint — no authentication required."""
    return {"module": "auth", "status": "ready"}


# ── Register ──────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    response_description="The newly created user profile (no password/hash).",
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Create a new student or teacher account.

    - `username` must be unique, 3–50 characters, alphanumeric + underscore.
    - `password` must be at least 8 characters.  It is hashed with bcrypt and
      the plaintext is never stored or returned.
    - `role` defaults to `student`; use `teacher` for educator accounts.
    """
    # Check for duplicate username
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{body.username}' is already taken.",
        )

    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and obtain a JWT access token",
    response_description="Bearer token and metadata.",
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Verify credentials and return a signed JWT access token.

    The token must be sent as `Authorization: Bearer <token>` on protected
    endpoints.  Token lifetime is controlled by `ACCESS_TOKEN_EXPIRE_MINUTES`
    in `backend/.env` (default 60 minutes).

    Returns **HTTP 401** for both "user not found" and "wrong password" to
    avoid leaking information about registered usernames.
    """
    _invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalars().first()

    if user is None or not verify_password(body.password, user.password_hash):
        raise _invalid

    token = create_access_token(subject=user.username, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role,
    )


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the current user's profile",
    response_description="Profile of the authenticated user.",
)
async def me(current_user: User = Depends(get_current_user)) -> User:
    """
    Return the profile of the currently authenticated user.

    Requires a valid `Authorization: Bearer <token>` header.
    Returns **HTTP 401** if the token is missing, expired, or invalid.
    """
    return current_user


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Log out (stateless JWT guidance)",
    response_description="Logout confirmation.",
)
def logout() -> LogoutResponse:
    """
    Stateless logout endpoint.

    Because JWTs are self-contained and signed, the server cannot invalidate
    them server-side without a token blocklist (Redis etc.).  This endpoint
    returns a confirmation and instructs the client to discard its token.

    A server-side blocklist can be added in a future step if required.
    """
    return LogoutResponse()
