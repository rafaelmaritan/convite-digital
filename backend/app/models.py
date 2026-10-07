from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    age: Mapped[int] = mapped_column(Integer)
    event_date: Mapped[date] = mapped_column("date", Date)
    event_time: Mapped[str] = mapped_column("time", String(20))
    location: Mapped[str] = mapped_column(String(200))
    address: Mapped[str] = mapped_column(String(300))
    rsvp_deadline: Mapped[date] = mapped_column(Date)
    message: Mapped[str] = mapped_column(Text, default="")
    theme: Mapped[str] = mapped_column(String(100), default="natural-editorial")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    rsvps: Mapped[list["RSVP"]] = relationship(back_populates="event", cascade="all, delete-orphan")


class RSVP(Base):
    __tablename__ = "rsvps"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    attending: Mapped[bool] = mapped_column(Boolean)
    adults: Mapped[int] = mapped_column(Integer, default=0)
    children: Mapped[int] = mapped_column(Integer, default=0)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    event: Mapped[Event] = relationship(back_populates="rsvps")
