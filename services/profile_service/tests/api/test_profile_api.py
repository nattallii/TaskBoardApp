import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.db.session import get_db
from app.services.profile_service import create_profile_if_not_exists
from app.schemas.profile import ProfileCreate, ProfileUpdate
from app.core.deps import get_current_user_id


@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    async def override_get_current_user_id():
        return 42

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_id] = override_get_current_user_id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_my_profile_returns_profile(client, db_session):
    await create_profile_if_not_exists(
        db_session,
        user_id=42,
        profile=ProfileCreate(username="tester", bio="hello"),
    )

    resp = await client.get("/api/v1/profile/me")

    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == 42
    assert body["username"] == "tester"


@pytest.mark.asyncio
async def test_get_my_profile_not_found(client):
    resp = await client.get("/api/v1/profile/me")

    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_my_profile(client, db_session):
    await create_profile_if_not_exists(
        db_session,
        user_id=42,
        profile=ProfileCreate(username="before", bio="old"),
    )

    resp = await client.patch(
        "/api/v1/profile/me",
        json=ProfileUpdate(username="after", bio="new").model_dump(exclude_none=True),
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "after"
    assert data["bio"] == "new"
