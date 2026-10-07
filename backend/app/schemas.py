from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class RSVPCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    attending: bool
    adults: int = Field(default=0, ge=0, le=12)
    children: int = Field(default=0, ge=0, le=12)
    message: str | None = Field(default=None, max_length=1000)
    website: str = Field(default="", max_length=200, exclude=True)

    @field_validator("name")
    @classmethod
    def strip_and_validate_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Informe seu nome.")
        return normalized

    @field_validator("message")
    @classmethod
    def normalize_message(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @model_validator(mode="after")
    def clear_guest_counts_when_declining(self) -> "RSVPCreate":
        if not self.attending:
            self.adults = 0
            self.children = 0
        return self


class RSVPRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    name: str
    attending: bool
    adults: int
    children: int
    message: str | None
    created_at: datetime


class RSVPAcknowledgement(BaseModel):
    message: str
