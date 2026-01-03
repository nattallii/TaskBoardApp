import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.db.session import get_db
from app.schemas.board import BoardCreate, BoardUpdate
from app.services.board_service import BoardService


@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_board_via_api(client):
    payload = {"title": "API Board", "description": "created via api"}

    response = await client.post("/api/v1/boards/", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "API Board"
    assert body["description"] == "created via api"
    assert body["owner_id"] == 1


@pytest.mark.asyncio
async def test_get_board_list(client, db_session):
    await BoardService.create_board(
        db_session,
        BoardCreate(title="First", description=None),
        owner_id=1,
    )
    await BoardService.create_board(
        db_session,
        BoardCreate(title="Second", description=None),
        owner_id=2,
    )

    resp = await client.get("/api/v1/boards/?skip=0&limit=10")

    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["boards"]) == 2


@pytest.mark.asyncio
async def test_get_single_board(client, db_session):
    board = await BoardService.create_board(
        db_session,
        BoardCreate(title="Single", description="one"),
        owner_id=3,
    )

    resp = await client.get(f"/api/v1/boards/{board.id}")

    assert resp.status_code == 200
    payload = resp.json()
    assert payload["id"] == board.id
    assert payload["title"] == "Single"


@pytest.mark.asyncio
async def test_update_board_via_api(client, db_session):
    board = await BoardService.create_board(
        db_session,
        BoardCreate(title="Old", description="old"),
        owner_id=1,
    )

    resp = await client.put(
        f"/api/v1/boards/{board.id}",
        json=BoardUpdate(title="Updated", description="new").model_dump(),
    )

    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated"


@pytest.mark.asyncio
async def test_delete_board_via_api(client, db_session):
    board = await BoardService.create_board(
        db_session,
        BoardCreate(title="Delete me", description=None),
        owner_id=1,
    )

    resp = await client.delete(f"/api/v1/boards/{board.id}")

    assert resp.status_code == 204

    resp2 = await client.get(f"/api/v1/boards/{board.id}")
    assert resp2.status_code == 404
