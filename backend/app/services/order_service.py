import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import async_session_factory
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.services.cart_service import CartService
from app.exceptions import InsufficientInventoryError


class OrderService:
    @staticmethod
    async def checkout(customer_id: uuid.UUID) -> Order | None:
        # Get active cart
        async with async_session_factory() as session:
            stmt = (
                select(Cart)
                .options(selectinload(Cart.items).selectinload(CartItem.product))
                .where(Cart.customer_id == customer_id)
            )
            result = await session.execute(stmt)
            cart = result.scalar_one_or_none()

            if not cart or not cart.items:
                return None

            total_amount = sum(item.product.price * item.quantity for item in cart.items)

            # Create Order
            order = Order(
                customer_id=customer_id,
                total_amount=total_amount,
                status="PENDING_COD"
            )
            session.add(order)
            await session.flush()  # To get order.id

            # Create Order Items
            for item in cart.items:
                if item.quantity > item.product.inventory:
                    raise InsufficientInventoryError(f"Sorry, we only have {item.product.inventory} of '{item.product.name}' available. Please reduce the quantity in your cart.")
                
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    price_at_purchase=item.product.price
                )
                session.add(order_item)
                
                # Decrement product inventory
                item.product.inventory = max(0, item.product.inventory - item.quantity)

            # Delete Cart
            await session.delete(cart)
            await session.commit()
            
            # Fetch created order with items
            stmt_order = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.customer)).where(Order.id == order.id)
            res = await session.execute(stmt_order)
            return res.scalar_one()
