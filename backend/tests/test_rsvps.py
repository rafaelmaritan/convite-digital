import os
from datetime import date

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["EVENT_RSVP_DEADLINE"] = "2099-12-31"
os.environ["CORS_ORIGINS"] = "http://localhost:4173"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select

from app import main
from app.database import SessionLocal, _database_url
from app.models import Event, RSVP


@pytest.fixture
def client():
    with TestClient(main.app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def isolate_test_state(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(main, "RSVP_RATE_LIMIT_MAX_REQUESTS", 3)
    monkeypatch.setattr(main, "RSVP_RATE_LIMIT_WINDOW_SECONDS", 60)

    with main._rsvp_attempts_lock:
        main._rsvp_attempts.clear()

    with SessionLocal() as session:
        session.execute(delete(RSVP))
        session.commit()


def response_count() -> int:
    with SessionLocal() as session:
        return session.scalar(select(func.count()).select_from(RSVP)) or 0


@pytest.mark.parametrize(
    "database_url",
    [
        "postgres://guest:secret@postgres.internal:5432/invitation",
        "postgresql://guest:secret@postgres.internal:5432/invitation",
        "postgresql+psycopg://guest:secret@postgres.internal:5432/invitation",
    ],
)
def test_postgres_database_urls_use_psycopg_driver(
    monkeypatch: pytest.MonkeyPatch,
    database_url: str,
) -> None:
    monkeypatch.setenv("DATABASE_URL", database_url)

    assert _database_url().drivername == "postgresql+psycopg"


def test_public_post_persists_normalized_rsvp(client: TestClient) -> None:
    response = client.post(
        "/api/events/pedro-1-ano/rsvps",
        json={
            "name": "  Ana Silva  ",
            "attending": True,
            "adults": 2,
            "children": 1,
            "message": "  Vamos levar um bolo?  ",
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Ana Silva"
    assert response.json()["message"] == "Vamos levar um bolo?"
    assert response_count() == 1


def test_honeypot_acknowledges_without_persisting(client: TestClient) -> None:
    response = client.post(
        "/api/events/pedro-1-ano/rsvps",
        json={
            "name": "Automação de teste",
            "attending": True,
            "adults": 1,
            "children": 0,
            "website": "https://bot.example",
        },
    )

    assert response.status_code == 202
    assert response.json() == {"message": "Resposta recebida."}
    assert response_count() == 0


def test_declined_rsvp_saves_zero_guest_counts(client: TestClient) -> None:
    response = client.post(
        "/api/events/pedro-1-ano/rsvps",
        json={
            "name": "Beatriz Lima",
            "attending": False,
            "adults": 4,
            "children": 2,
        },
    )

    assert response.status_code == 201
    assert response.json()["adults"] == 0
    assert response.json()["children"] == 0
    assert response_count() == 1


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "   ", "attending": True},
        {"name": "Ana", "attending": True, "adults": 13},
    ],
)
def test_invalid_rsvp_is_rejected_without_persisting(
    client: TestClient,
    payload: dict[str, object],
) -> None:
    response = client.post("/api/events/pedro-1-ano/rsvps", json=payload)

    assert response.status_code == 422
    assert response_count() == 0


def test_rsvp_list_get_is_not_available_in_first_delivery(client: TestClient) -> None:
    response = client.get("/api/events/pedro-1-ano/rsvps")

    assert response.status_code == 405


def test_rsvp_after_event_deadline_is_rejected(client: TestClient) -> None:
    with SessionLocal() as session:
        event = session.scalar(select(Event).where(Event.slug == "pedro-1-ano"))
        assert event is not None
        event.rsvp_deadline = date(2000, 1, 1)
        session.commit()

    response = client.post(
        "/api/events/pedro-1-ano/rsvps",
        json={"name": "Convidado", "attending": True, "adults": 1},
    )

    assert response.status_code == 409
    assert response_count() == 0


def test_cors_does_not_allow_unknown_origin(client: TestClient) -> None:
    response = client.post(
        "/api/events/pedro-1-ano/rsvps",
        json={"name": "Convidado", "attending": True, "adults": 1},
        headers={"Origin": "https://unknown.example"},
    )

    assert response.status_code == 201
    assert "Access-Control-Allow-Origin" not in response.headers


def test_rate_limit_returns_retry_after_and_cors_headers(client: TestClient) -> None:
    headers = {"Origin": "http://localhost:4173"}
    endpoint = "/api/events/pedro-1-ano/rsvps"
    payload = {"name": "Convidado", "attending": True, "adults": 1, "children": 0}

    for _ in range(3):
        assert client.post(endpoint, json=payload, headers=headers).status_code == 201

    limited = client.post(endpoint, json=payload, headers=headers)

    assert limited.status_code == 429
    assert limited.headers["Retry-After"] == "60"
    assert limited.headers["Access-Control-Allow-Origin"] == "http://localhost:4173"
