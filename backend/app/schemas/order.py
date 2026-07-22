import uuid
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.customer import CustomerResponse


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str | None = None
    quantity: int
    price_at_purchase: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str | None = None
    customer: CustomerResponse | None = None
    total_amount: Decimal
    status: str
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime


class OrderStatusUpdateRequest(BaseModel):
    status: str  # PENDING_COD, CONFIRMED, CANCELLED
