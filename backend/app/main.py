import os
from collections import deque
from collections.abc import Awaitable, Callable
from contextlib import asynccontextmanager
from datetime import date, datetime
from math import ceil
from threading import Lock
from time import monotonic
from zoneinfo import ZoneInfo

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine, get_db
from app.models import Event, RSVP
from app.schemas import RSVPCreate, RSVPAcknowledgement, RSVPRead


EVENT_SLUG = os.getenv("EVENT_SLUG", "pedro-1-ano")
EVENT_NAME = os.getenv("EVENT_NAME", "Pedro")
EVENT_AGE = int(os.getenv("EVENT_AGE", "1"))
EVENT_DATE = date.fromisoformat(os.getenv("EVENT_DATE", "2026-12-05"))
EVENT_TIME = os.getenv("EVENT_TIME", "15:00")
EVENT_LOCATION = os.getenv("EVENT_LOCATION", "Espaço Quintal")
EVENT_ADDRESS = os.getenv("EVENT_ADDRESS", "Rua das Acácias, 120")
EVENT_CITY = os.getenv("EVENT_CITY", "São Paulo, SP")
EVENT_RSVP_DEADLINE = date.fromisoformat(os.getenv("EVENT_RSVP_DEADLINE", "2026-11-20"))
EVENT_MESSAGE = os.getenv(
    "EVENT_MESSAGE",
    "Um ano inteiro de descobertas, abraços e alegria. Vamos celebrar esse dia bonito juntos?",
)
RSVP_RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RSVP_RATE_LIMIT_MAX_REQUESTS", "10"))
RSVP_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RSVP_RATE_LIMIT_WINDOW_SECONDS", "600"))
if RSVP_RATE_LIMIT_MAX_REQUESTS < 1 or RSVP_RATE_LIMIT_WINDOW_SECONDS < 1:
    raise ValueError("RSVP rate-limit settings must be positive integers.")

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://127.0.0.1:4173,http://localhost:4173",
    ).split(",")
    if origin.strip()
]
_rsvp_attempts: dict[str, deque[float]] = {}
_rsvp_attempts_lock = Lock()
_last_rsvp_cleanup = 0.0


def _register_rsvp_attempt(client_ip: str) -> int | None:
    global _last_rsvp_cleanup

    now = monotonic()
    cutoff = now - RSVP_RATE_LIMIT_WINDOW_SECONDS
    with _rsvp_attempts_lock:
        if now - _last_rsvp_cleanup >= min(RSVP_RATE_LIMIT_WINDOW_SECONDS, 60):
            for ip, attempts in list(_rsvp_attempts.items()):
                while attempts and attempts[0] <= cutoff:
                    attempts.popleft()
                if not attempts:
                    del _rsvp_attempts[ip]
            _last_rsvp_cleanup = now

        attempts = _rsvp_attempts.setdefault(client_ip, deque())
        while attempts and attempts[0] <= cutoff:
            attempts.popleft()

        if len(attempts) >= RSVP_RATE_LIMIT_MAX_REQUESTS:
            return max(1, ceil(RSVP_RATE_LIMIT_WINDOW_SECONDS - (now - attempts[0])))

        attempts.append(now)
        return None


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        event = session.scalar(select(Event).where(Event.slug == EVENT_SLUG))
        values = {
            "name": EVENT_NAME,
            "age": EVENT_AGE,
            "event_date": EVENT_DATE,
            "event_time": EVENT_TIME,
            "location": EVENT_LOCATION,
            "address": EVENT_ADDRESS,
            "rsvp_deadline": EVENT_RSVP_DEADLINE,
            "message": EVENT_MESSAGE,
            "theme": "natural-editorial",
        }

        if event is None:
            session.add(Event(slug=EVENT_SLUG, **values))
        else:
            for field, value in values.items():
                setattr(event, field, value)

        session.commit()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Convite Digital API", version="0.1.0", lifespan=lifespan)
@app.middleware("http")
async def limit_rsvp_requests(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    path = request.url.path
    if request.method == "POST" and path.startswith("/api/events/") and path.endswith("/rsvps"):
        client_ip = request.client.host if request.client else "unknown"
        retry_after = _register_rsvp_attempt(client_ip)
        if retry_after is not None:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."},
                headers={"Retry-After": str(retry_after)},
            )

    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    expose_headers=["Retry-After"],
)


def event_or_404(session: Session, slug: str) -> Event:
    event = session.scalar(select(Event).where(Event.slug == slug))
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado.")
    return event


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/api/events/{slug}/rsvps",
    response_model=RSVPRead | RSVPAcknowledgement,
    status_code=status.HTTP_201_CREATED,
    responses={status.HTTP_202_ACCEPTED: {"model": RSVPAcknowledgement}},
)
def create_rsvp(
    slug: str,
    payload: RSVPCreate,
    response: Response,
    session: Session = Depends(get_db),
) -> RSVP | RSVPAcknowledgement:
    if payload.website.strip():
        response.status_code = status.HTTP_202_ACCEPTED
        return RSVPAcknowledgement(message="Resposta recebida.")

    event = event_or_404(session, slug)
    today_in_brazil = datetime.now(ZoneInfo("America/Sao_Paulo")).date()
    if today_in_brazil > event.rsvp_deadline:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O prazo para confirmar presença já terminou.",
        )

    rsvp = RSVP(event_id=event.id, **payload.model_dump(exclude={"website"}))
    session.add(rsvp)
    session.commit()
    session.refresh(rsvp)
    return rsvp
