import os
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import URL, create_engine, make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool


def _database_url() -> URL:
    configured_url = os.getenv("DATABASE_URL")
    if configured_url:
        url = make_url(configured_url)
        if url.drivername in {"postgres", "postgresql"}:
            return url.set(drivername="postgresql+psycopg")
        return url

    database_path = Path(__file__).resolve().parents[1] / "rsvps.sqlite3"
    return URL.create("sqlite", database=str(database_path))


url = _database_url()
connect_args = {"check_same_thread": False} if url.get_backend_name() == "sqlite" else {}
engine_options = {"connect_args": connect_args, "pool_pre_ping": True}

if url.get_backend_name() == "sqlite" and url.database in (None, "", ":memory:"):
    engine_options["poolclass"] = StaticPool

engine = create_engine(url, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
