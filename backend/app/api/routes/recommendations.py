"""
Recommendations router — /api/v1/recommendations

Planned endpoints (future steps):
  GET  /api/v1/recommendations/next-lesson   — suggest the next lesson for the current user
  GET  /api/v1/recommendations/vocabulary    — suggest vocabulary items to review
  GET  /api/v1/recommendations/daily         — daily personalised learning plan
"""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

MODULE_NAME = "recommendations"


@router.get(
    "/status",
    summary="Recommendations module status",
    response_description="Confirms the recommendations module is reachable.",
)
def recommendations_status() -> dict[str, str]:
    """Architecture verification endpoint for the recommendations module."""
    return {"module": MODULE_NAME, "status": "ready"}
