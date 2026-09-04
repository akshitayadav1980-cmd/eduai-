"""
Users router — /api/v1/users

Planned endpoints (future steps):
  GET    /api/v1/users/me        — retrieve the current user's profile
  PUT    /api/v1/users/me        — update profile details
  GET    /api/v1/users/{user_id} — retrieve any user by ID (admin)
  DELETE /api/v1/users/{user_id} — delete a user account (admin)
"""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["Users"])

MODULE_NAME = "users"


@router.get(
    "/status",
    summary="Users module status",
    response_description="Confirms the users module is reachable.",
)
def users_status() -> dict[str, str]:
    """Architecture verification endpoint for the users module."""
    return {"module": MODULE_NAME, "status": "ready"}
