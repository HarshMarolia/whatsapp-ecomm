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
from app.models.order import Order

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=SuccessResponse[list[OrderResponse]])
async def list_orders(
    status: str | None = None,
    # _: str = Depends(get_current_clerk_user_id),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
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
    stmt = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
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
    stmt = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    result = await session.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise NotFoundError("Order not found")
    order.status = data.status
    await session.flush()
    await session.refresh(order)
    return SuccessResponse(data=OrderResponse.model_validate(order), message="Order updated")
