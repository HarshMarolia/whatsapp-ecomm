from __future__ import annotations

from pydantic import BaseModel, Field


class _TextBody(BaseModel):
    body: str


class _ImageBody(BaseModel):
    id: str | None = None
    url: str | None = None
    mime_type: str | None = None
    sha256: str | None = None


class _Profile(BaseModel):
    name: str


class _Contact(BaseModel):
    profile: _Profile | None = None
    wa_id: str


class WebhookMessage(BaseModel):
    id: str
    from_: str = Field(alias="from")
    timestamp: str
    type: str
    text: _TextBody | None = None
    image: _ImageBody | None = None

    model_config = {"populate_by_name": True}


class _Value(BaseModel):
    messaging_product: str
    metadata: dict
    contacts: list[_Contact] = []
    messages: list[WebhookMessage] = []
    statuses: list[dict] = []


class _Change(BaseModel):
    value: _Value
    field: str


class _Entry(BaseModel):
    id: str
    changes: list[_Change]


class WebhookPayload(BaseModel):
    object: str
    entry: list[_Entry]
