import uuid
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    price_at_purchase: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    customer_id: uuid.UUID
    total_amount: Decimal
    status: str
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime


class OrderStatusUpdateRequest(BaseModel):
    status: str  # PENDING_COD, CONFIRMED, CANCELLED
