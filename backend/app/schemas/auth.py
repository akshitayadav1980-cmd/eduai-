"""
Pydantic schemas for the Authentication API.

Endpoints:
    POST /api/v1/auth/register
    POST /api/v1/auth/login
    GET  /api/v1/auth/me
    POST /api/v1/auth/logout
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


# ── Supported roles ────────────────────────────────────────────────────────────

SUPPORTED_ROLES: frozenset[str] = frozenset({"student", "teacher"})


# ── Registration ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Body for POST /api/v1/auth/register."""

    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Username (3–50 characters, alphanumeric + underscore).",
        examples=["aarav_sharma"],
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (8–128 characters).",
        examples=["SecurePass123"],
    )
    role: str = Field(
        default="student",
        description="User role: student or teacher.",
        examples=["student"],
    )

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        v = v.strip()
        if not v.replace("_", "").isalnum():
            raise ValueError(
                "username may only contain letters, digits, and underscores."
            )
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("password must not be blank.")
        return v  # do NOT strip — spaces in passwords are intentional

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in SUPPORTED_ROLES:
            raise ValueError(
                f"role '{v}' is not valid. Supported values: {sorted(SUPPORTED_ROLES)}."
            )
        return v


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Body for POST /api/v1/auth/login."""

    username: str = Field(..., description="Registered username.")
    password: str = Field(..., description="Account password.")

    @field_validator("username")
    @classmethod
    def username_lower(cls, v: str) -> str:
        return v.strip().lower()


# ── Token response ────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """Response for POST /api/v1/auth/login."""

    access_token: str = Field(description="JWT bearer token.")
    token_type: str = Field(default="bearer", description="Token type (always 'bearer').")
    expires_in: int = Field(description="Token lifetime in seconds.")
    role: str = Field(description="Role of the authenticated user.")


# ── User profile ──────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """Safe user profile — never contains password_hash."""

    id: int = Field(description="Internal user ID.")
    username: str = Field(description="Username.")
    role: str = Field(description="User role: student or teacher.")
    created_at: datetime = Field(description="Account creation timestamp (UTC).")

    model_config = {"from_attributes": True}


# ── Logout ────────────────────────────────────────────────────────────────────

class LogoutResponse(BaseModel):
    """Response for POST /api/v1/auth/logout."""

    message: str = Field(
        default=(
            "Logged out. "
            "Because JWTs are stateless, the token remains technically valid until "
            "it expires. Discard it on the client side to complete logout."
        ),
        description="Logout confirmation with guidance.",
    )
