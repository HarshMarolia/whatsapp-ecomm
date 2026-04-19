from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampBase


class Product(TimestampBase):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    variant: Mapped[str | None] = mapped_column(String(100), nullable=True)
    inventory: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    original_image_url: Mapped[str] = mapped_column(Text, nullable=False)
    qr_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    qr_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    fallback_product_id: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_products_deleted_at", "deleted_at"),
        Index("ix_products_fallback_product_id", "fallback_product_id"),
    )
