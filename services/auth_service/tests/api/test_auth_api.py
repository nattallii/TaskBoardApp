import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.db.session import get_db
from app.core.security import hash_password
from app.models.auth import User
from app.services import auth_service
from app.schemas.auth import UserCreate, UserLogin
from app.main import rabbitmq


@pytest.fixture
async def client(db_session, monkeypatch):
    async def override_get_db():
        yield db_session

    async def noop(*args, **kwargs):
        return None

    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr(rabbitmq, "connect", noop)
    monkeypatch.setattr(rabbitmq, "close", noop)
    monkeypatch.setattr(auth_service, "publish_profile_create_event", noop)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_endpoint_creates_user(client, db_session):
    payload = UserCreate(username="apiuser", email="api@example.com", password="secret")

    response = await client.post("/api/v1/auth/register", json=payload.model_dump())

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"

    saved = await db_session.execute(
        User.__table__.select().where(User.email == payload.email)
    )
    assert saved.first() is not None


@pytest.mark.asyncio
async def test_login_endpoint_returns_tokens(client, db_session):
    user = User(
        username="apilogin",
        email="login@example.com",
        password=hash_password("pass123"),
    )
    db_session.add(user)
    await db_session.commit()

    payload = UserLogin(email=user.email, password="pass123")

    response = await client.post("/api/v1/auth/login", json=payload.model_dump())

    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
