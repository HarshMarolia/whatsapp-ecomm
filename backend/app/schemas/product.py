import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator


class ProductCreateRequest(BaseModel):
    name: str
    price: Decimal
    variant: str | None = None
    inventory: int = 0
    original_image_url: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v

    @field_validator("inventory")
    @classmethod
    def inventory_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Inventory cannot be negative")
        return v


class ProductUpdateRequest(BaseModel):
    name: str | None = None
    price: Decimal | None = None
    variant: str | None = None
    inventory: int | None = None
    is_active: bool | None = None
    original_image_url: str | None = None
    qr_image_url: str | None = None
    qr_payload: str | None = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and v <= 0:
            raise ValueError("Price must be greater than 0")
        return v

    @field_validator("inventory")
    @classmethod
    def inventory_non_negative(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("Inventory cannot be negative")
        return v


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    price: Decimal
    variant: str | None
    inventory: int
    is_active: bool
    original_image_url: str
    qr_image_url: str | None
    qr_payload: str | None
    fallback_product_id: str


class UploadSignatureResponse(BaseModel):
    cloud_name: str
    api_key: str
    timestamp: int
    signature: str
    folder: str


class GenerateQRResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    qr_image_url: str
    qr_payload: str
