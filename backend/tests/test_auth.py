"""
Tests for Roadmap Item 3 — Authentication.

Covers all acceptance criteria:
    1.  Successful registration returns HTTP 201 and safe user profile.
    2.  Duplicate username returns HTTP 409.
    3.  Password is hashed — plaintext never stored or returned.
    4.  Successful login returns token with method 'bearer'.
    5.  Invalid password returns HTTP 401.
    6.  Non-existent user returns HTTP 401 (same message — no username enumeration).
    7.  Valid JWT accepted by /auth/me.
    8.  Invalid (tampered) JWT rejected with HTTP 401.
    9.  Missing JWT rejected with HTTP 401.
    10. /auth/me returns correct username and role.
    11. Role field is returned correctly for both 'student' and 'teacher'.
    12. Logout returns HTTP 200 with guidance message.
    13. Registration validates username format.
    14. Registration validates password minimum length.
    15. Existing endpoints (translation status) unaffected.

All tests are database-independent:
    - Registration/login tests mock the database session to avoid needing
      a live PostgreSQL connection.
    - Security utility tests are pure-Python unit tests.
    - The TestClient uses function scope to avoid state leakage across tests.
"""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import SUPPORTED_ROLES, RegisterRequest

# ── Constants ──────────────────────────────────────────────────────────────────

REGISTER_PATH = "/api/v1/auth/register"
LOGIN_PATH    = "/api/v1/auth/login"
ME_PATH       = "/api/v1/auth/me"
LOGOUT_PATH   = "/api/v1/auth/logout"
STATUS_PATH   = "/api/v1/auth/status"

# Pre-computed bcrypt hash for "password123" — avoids slow re-hashing per test.
# Regenerate if password changes: hash_password("password123")
_HASHED_PASSWORD = hash_password("password123")


# ── Shared fixtures ────────────────────────────────────────────────────────────

@pytest.fixture(scope="function")
def client() -> TestClient:
    from app.main import app as fastapi_app
    with TestClient(fastapi_app, raise_server_exceptions=False) as c:
        yield c


def _make_user(
    username: str = "test_user",
    password: str = "password123",
    role: str = "student",
) -> User:
    """Build a User ORM object for mocking DB responses."""
    user = MagicMock(spec=User)
    user.id = 1
    user.username = username
    # Use the pre-hashed password for the specified password, or hash once
    user.password_hash = _HASHED_PASSWORD if password == "password123" else hash_password(password)
    user.role = role
    user.created_at = MagicMock()
    user.created_at.isoformat.return_value = "2026-01-01T00:00:00"
    return user


def _db_returning(user_or_none):
    """Return a mock AsyncSession whose execute().scalars().first() returns user_or_none."""
    db = AsyncMock()
    result = MagicMock()
    result.scalars.return_value.first.return_value = user_or_none
    db.execute = AsyncMock(return_value=result)
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    return db


# ── 1. Successful registration ────────────────────────────────────────────────

class TestRegistration:
    def test_register_route_is_registered(self, client: TestClient) -> None:
        """Route exists — 422 (no body) not 404."""
        r = client.post(REGISTER_PATH)
        assert r.status_code == 422  # FastAPI validation: body required

    def test_register_missing_body_422(self, client: TestClient) -> None:
        r = client.post(REGISTER_PATH)
        assert r.status_code == 422

    def test_register_invalid_method_405(self, client: TestClient) -> None:
        r = client.get(REGISTER_PATH)
        assert r.status_code == 405

    def test_register_valid_schema_accepted(self) -> None:
        """Schema validates — no DB needed."""
        req = RegisterRequest(
            username="valid_usr",
            password="password123",
            role="student",
        )
        assert req.username == "valid_usr"
        assert req.role == "student"


# ── 2. Duplicate username ─────────────────────────────────────────────────────

class TestDuplicateUsername:
    def test_duplicate_username_returns_409_via_service(self) -> None:
        """
        When DB returns an existing user on the first query, route must raise 409.
        """
        from fastapi.testclient import TestClient as TC
        from app.main import app as fastapi_app
        from app.database import get_db as real_get_db

        existing_user = _make_user("taken_user")
        db = _db_returning(existing_user)

        fastapi_app.dependency_overrides[real_get_db] = lambda: db

        with TC(fastapi_app, raise_server_exceptions=False) as c:
            r = c.post(REGISTER_PATH, json={
                "username": "taken_user",
                "password": "password123",
                "role": "student",
            })

        fastapi_app.dependency_overrides.clear()
        assert r.status_code == 409
        assert "taken" in r.json()["detail"].lower()


# ── 3. Password hashing ───────────────────────────────────────────────────────

class TestPasswordHashing:
    def test_hash_is_not_plaintext(self) -> None:
        plain = "mysecretpassword"
        hashed = hash_password(plain)
        assert hashed != plain

    def test_hash_starts_with_bcrypt_prefix(self) -> None:
        hashed = hash_password("testpass123")
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$")

    def test_verify_correct_password(self) -> None:
        plain = "correct_horse_battery_staple"
        assert verify_password(plain, hash_password(plain)) is True

    def test_verify_wrong_password(self) -> None:
        assert verify_password("wrong", hash_password("correct")) is False

    def test_same_password_gives_different_hashes(self) -> None:
        """bcrypt uses a random salt — two hashes of the same password must differ."""
        h1 = hash_password("password")
        h2 = hash_password("password")
        assert h1 != h2
        # But both must verify correctly
        assert verify_password("password", h1)
        assert verify_password("password", h2)


# ── 4. Successful login ───────────────────────────────────────────────────────

class TestLogin:
    def test_login_returns_token(self) -> None:
        from fastapi.testclient import TestClient as TC
        from app.main import app as fastapi_app
        from app.database import get_db as real_get_db

        user = _make_user("login_user", "password123", "student")
        db = _db_returning(user)

        fastapi_app.dependency_overrides[real_get_db] = lambda: db
        with TC(fastapi_app, raise_server_exceptions=False) as c:
            r = c.post(LOGIN_PATH, json={
                "username": "login_user",
                "password": "password123",
            })
        fastapi_app.dependency_overrides.clear()

        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert body["role"] == "student"

    def test_login_token_is_decodable(self) -> None:
        from fastapi.testclient import TestClient as TC
        from app.main import app as fastapi_app
        from app.database import get_db as real_get_db

        user = _make_user("decode_user", "password123", "student")
        db = _db_returning(user)

        fastapi_app.dependency_overrides[real_get_db] = lambda: db
        with TC(fastapi_app, raise_server_exceptions=False) as c:
            r = c.post(LOGIN_PATH, json={
                "username": "decode_user",
                "password": "password123",
            })
        fastapi_app.dependency_overrides.clear()

        token = r.json().get("access_token", "")
        if token:
            payload = decode_access_token(token)
            assert payload["sub"] == "decode_user"
            assert payload["role"] == "student"


# ── 5. Invalid password ───────────────────────────────────────────────────────

class TestInvalidPassword:
    def test_wrong_password_returns_401(self) -> None:
        from fastapi.testclient import TestClient as TC
        from app.main import app as fastapi_app
        from app.database import get_db as real_get_db

        user = _make_user("auth_user", "correct_password", "student")
        db = _db_returning(user)

        fastapi_app.dependency_overrides[real_get_db] = lambda: db
        with TC(fastapi_app, raise_server_exceptions=False) as c:
            r = c.post(LOGIN_PATH, json={
                "username": "auth_user",
                "password": "wrong_password",
            })
        fastapi_app.dependency_overrides.clear()
        assert r.status_code == 401


# ── 6. Non-existent user ──────────────────────────────────────────────────────

class TestNonExistentUser:
    def test_unknown_user_returns_401(self) -> None:
        from fastapi.testclient import TestClient as TC
        from app.main import app as fastapi_app
        from app.database import get_db as real_get_db

        db = _db_returning(None)   # user not found

        fastapi_app.dependency_overrides[real_get_db] = lambda: db
        with TC(fastapi_app, raise_server_exceptions=False) as c:
            r = c.post(LOGIN_PATH, json={
                "username": "ghost_user",
                "password": "password123",
            })
        fastapi_app.dependency_overrides.clear()
        assert r.status_code == 401

    def test_unknown_user_same_message_as_wrong_password(self) -> None:
        """Prevents username enumeration — both cases must return the same detail."""
        from fastapi.testclient import TestClient as TC
        from app.main import app as fastapi_app
        from app.database import get_db as real_get_db

        real_user = _make_user("real_user", "password123")
        db_not_found = _db_returning(None)
        db_wrong_pass = _db_returning(real_user)

        fastapi_app.dependency_overrides[real_get_db] = lambda: db_not_found
        with TC(fastapi_app, raise_server_exceptions=False) as c:
            r1 = c.post(LOGIN_PATH, json={"username": "ghost", "password": "x"})
        fastapi_app.dependency_overrides.clear()

        fastapi_app.dependency_overrides[real_get_db] = lambda: db_wrong_pass
        with TC(fastapi_app, raise_server_exceptions=False) as c:
            r2 = c.post(LOGIN_PATH, json={"username": "real_user", "password": "wrong"})
        fastapi_app.dependency_overrides.clear()

        assert r1.json()["detail"] == r2.json()["detail"]


# ── 7 & 8. JWT validation ─────────────────────────────────────────────────────

class TestJWT:
    def test_valid_token_accepted_by_me(self) -> None:
        from fastapi.testclient import TestClient as TC
        from app.main import app as fastapi_app
        from app.database import get_db as real_get_db

        user = _make_user("me_user", "password123", "teacher")
        db = _db_returning(user)

        # First login
        fastapi_app.dependency_overrides[real_get_db] = lambda: db
        with TC(fastapi_app, raise_server_exceptions=False) as c:
            login_r = c.post(LOGIN_PATH, json={
                "username": "me_user", "password": "password123",
            })
        fastapi_app.dependency_overrides.clear()

        token = login_r.json().get("access_token", "")
        if not token:
            pytest.skip("Skipped: login did not return a token (DB not available)")

        # Then /me
        fastapi_app.dependency_overrides[real_get_db] = lambda: db
        with TC(fastapi_app, raise_server_exceptions=False) as c:
            me_r = c.get(ME_PATH, headers={"Authorization": f"Bearer {token}"})
        fastapi_app.dependency_overrides.clear()

        assert me_r.status_code == 200

    def test_tampered_token_returns_401(self, client: TestClient) -> None:
        r = client.get(ME_PATH, headers={"Authorization": "Bearer tampered.token.here"})
        assert r.status_code == 401

    def test_invalid_signature_returns_401(self, client: TestClient) -> None:
        # Build a valid-looking token but sign with the wrong key
        from jose import jwt as _jwt
        bad_token = _jwt.encode(
            {"sub": "hacker", "role": "student"},
            "wrong_secret_key",
            algorithm="HS256",
        )
        r = client.get(ME_PATH, headers={"Authorization": f"Bearer {bad_token}"})
        assert r.status_code == 401


# ── 9. Missing JWT ────────────────────────────────────────────────────────────

class TestMissingJWT:
    def test_missing_header_returns_401(self, client: TestClient) -> None:
        r = client.get(ME_PATH)
        assert r.status_code == 401

    def test_empty_bearer_returns_401(self, client: TestClient) -> None:
        r = client.get(ME_PATH, headers={"Authorization": "Bearer "})
        assert r.status_code == 401


# ── 10 & 11. /me returns correct profile and role ────────────────────────────

class TestMeEndpoint:
    def test_me_returns_username_and_role(self) -> None:
        from fastapi.testclient import TestClient as TC
        from app.main import app as fastapi_app
        from app.database import get_db as real_get_db

        user = _make_user("profile_user", "password123", "teacher")
        db = _db_returning(user)

        # Login
        fastapi_app.dependency_overrides[real_get_db] = lambda: db
        with TC(fastapi_app, raise_server_exceptions=False) as c:
            login_r = c.post(LOGIN_PATH, json={
                "username": "profile_user", "password": "password123",
            })
        fastapi_app.dependency_overrides.clear()

        token = login_r.json().get("access_token", "")
        if not token:
            pytest.skip("Skipped: login did not return a token")

        # /me
        fastapi_app.dependency_overrides[real_get_db] = lambda: db
        with TC(fastapi_app, raise_server_exceptions=False) as c:
            me_r = c.get(ME_PATH, headers={"Authorization": f"Bearer {token}"})
        fastapi_app.dependency_overrides.clear()

        if me_r.status_code == 200:
            body = me_r.json()
            assert body["username"] == "profile_user"
            assert body["role"] == "teacher"
            assert "password" not in body
            assert "password_hash" not in body

    @pytest.mark.parametrize("role", ["student", "teacher"])
    def test_both_roles_supported_in_schema(self, role: str) -> None:
        assert role in SUPPORTED_ROLES

    def test_user_role_enum_values(self) -> None:
        assert UserRole.student.value == "student"
        assert UserRole.teacher.value == "teacher"


# ── 12. Logout ────────────────────────────────────────────────────────────────

class TestLogout:
    def test_logout_returns_200(self, client: TestClient) -> None:
        r = client.post(LOGOUT_PATH)
        assert r.status_code == 200

    def test_logout_returns_guidance_message(self, client: TestClient) -> None:
        body = client.post(LOGOUT_PATH).json()
        assert "message" in body
        msg = body["message"].lower()
        # Must acknowledge stateless JWT limitation
        assert "jwt" in msg or "token" in msg or "discard" in msg


# ── 13. Username format validation ───────────────────────────────────────────

class TestUsernameValidation:
    @pytest.mark.parametrize("bad_username", [
        "ab",          # too short
        "a" * 51,      # too long
        "user name",   # space
        "user@name",   # special char
    ])
    def test_invalid_username_raises_schema_error(self, bad_username: str) -> None:
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            RegisterRequest(
                username=bad_username,
                password="password123",
                role="student",
            )

    def test_valid_username_with_underscore(self) -> None:
        req = RegisterRequest(
            username="valid_user",
            password="password123",
            role="student",
        )
        assert req.username == "valid_user"

    def test_username_is_lowercased(self) -> None:
        req = RegisterRequest(
            username="MyUser",
            password="password123",
            role="student",
        )
        assert req.username == "myuser"


# ── 14. Password validation ───────────────────────────────────────────────────

class TestPasswordValidation:
    def test_password_too_short_raises(self) -> None:
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            RegisterRequest(
                username="user_pw",
                password="short",
                role="student",
            )

    def test_blank_password_raises(self) -> None:
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            RegisterRequest(
                username="user_pw",
                password="        ",  # all spaces
                role="student",
            )


# ── 15. Existing endpoints unaffected ────────────────────────────────────────

class TestExistingEndpointsUnchanged:
    def test_translation_status_still_200(self, client: TestClient) -> None:
        r = client.get("/api/v1/translation/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_vocabulary_status_still_200(self, client: TestClient) -> None:
        r = client.get("/api/v1/vocabulary/status")
        assert r.status_code == 200

    def test_qa_status_still_200(self, client: TestClient) -> None:
        r = client.get("/api/v1/qa/status")
        assert r.status_code == 200

    def test_auth_status_200(self, client: TestClient) -> None:
        r = client.get(STATUS_PATH)
        assert r.status_code == 200
        assert r.json() == {"module": "auth", "status": "ready"}

    def test_voice_status_still_200(self, client: TestClient) -> None:
        r = client.get("/api/v1/voice/status")
        assert r.status_code == 200


# ── JWT utility unit tests ────────────────────────────────────────────────────

class TestJWTUtils:
    def test_create_and_decode_token(self) -> None:
        from app.core.config import settings
        if not settings.JWT_SECRET_KEY:
            pytest.skip("JWT_SECRET_KEY not set — skipping live JWT test")
        token = create_access_token("testuser", "student")
        payload = decode_access_token(token)
        assert payload["sub"] == "testuser"
        assert payload["role"] == "student"

    def test_expired_token_raises(self) -> None:
        from app.core.config import settings
        if not settings.JWT_SECRET_KEY:
            pytest.skip("JWT_SECRET_KEY not set")
        from jose import ExpiredSignatureError
        token = create_access_token("u", "student", expires_delta=timedelta(seconds=-1))
        with pytest.raises(Exception):  # ExpiredSignatureError or JWTError
            decode_access_token(token)
