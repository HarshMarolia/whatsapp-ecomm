from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampBase
from app.models.customer import Customer
from app.models.product import Product


class Order(TimestampBase):
    __tablename__ = "orders"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="PENDING_COD"
    )

    customer: Mapped[Customer] = relationship("Customer")
    items: Mapped[list[OrderItem]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def customer_name(self) -> str | None:
        return self.customer.name if self.customer else None

    __table_args__ = (
        Index("ix_orders_customer_id", "customer_id"),
        Index("ix_orders_status", "status"),
    )


class OrderItem(TimestampBase):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    price_at_purchase: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )

    order: Mapped[Order] = relationship("Order", back_populates="items")
    product: Mapped[Product] = relationship("Product")

    @property
    def product_name(self) -> str | None:
        return self.product.name if self.product else None

    __table_args__ = (Index("ix_order_items_order_id", "order_id"),)
