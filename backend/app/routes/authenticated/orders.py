import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_clerk_user_id
from app.exceptions import NotFoundError
from app.schemas.base import SuccessResponse
from app.schemas.order import OrderResponse, OrderStatusUpdateRequest
from app.models.order import Order, OrderItem

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=SuccessResponse[list[OrderResponse]])
async def list_orders(
    status: str | None = None,
    # _: str = Depends(get_current_clerk_user_id),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.customer)).order_by(Order.created_at.desc())
    if status:
        stmt = stmt.where(Order.status == status)
    result = await session.execute(stmt)
    orders = list(result.scalars().all())
    return SuccessResponse(data=[OrderResponse.model_validate(o) for o in orders])


@router.get("/{order_id}", response_model=SuccessResponse[OrderResponse])
async def get_order(
    order_id: uuid.UUID,
    # _: str = Depends(get_current_clerk_user_id),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.customer)).where(Order.id == order_id)
    result = await session.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise NotFoundError("Order not found")
    return SuccessResponse(data=OrderResponse.model_validate(order))


@router.patch("/{order_id}", response_model=SuccessResponse[OrderResponse])
async def update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdateRequest,
    # _: str = Depends(get_current_clerk_user_id),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.customer)).where(Order.id == order_id)
    result = await session.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise NotFoundError("Order not found")

    # Inventory restoration logic
    if data.status == "CANCELLED" and order.status != "CANCELLED":
        for item in order.items:
            if item.product:
                item.product.inventory += item.quantity
    elif order.status == "CANCELLED" and data.status != "CANCELLED":
        # If an order is un-cancelled, we must deduct the inventory again
        for item in order.items:
            if item.product:
                item.product.inventory = max(0, item.product.inventory - item.quantity)

    order.status = data.status
    await session.commit()
    return SuccessResponse(data=OrderResponse.model_validate(order), message="Order updated")
