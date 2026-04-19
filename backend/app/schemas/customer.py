import re
import uuid

from pydantic import BaseModel, ConfigDict, field_validator


class DeliveryAddress(BaseModel):
    name: str
    line1: str
    line2: str | None = None
    city: str
    pincode: str
    phone: str


class CustomerCreateRequest(BaseModel):
    whatsapp_number: str
    name: str | None = None

    @field_validator("whatsapp_number")
    @classmethod
    def validate_e164(cls, v: str) -> str:
        if not re.match(r"^\+\d{7,15}$", v):
            raise ValueError("whatsapp_number must be E.164 format, e.g. +919876543210")
        return v


class CustomerUpdateRequest(BaseModel):
    name: str | None = None
    delivery_address: DeliveryAddress | None = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    whatsapp_number: str
    name: str | None
    delivery_address: dict | None
