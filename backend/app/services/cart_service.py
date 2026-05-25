import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import async_session_factory
from app.models.cart import Cart, CartItem
from app.models.product import Product


class CartService:
    @staticmethod
    async def get_or_create_cart(customer_id: uuid.UUID) -> Cart:
        async with async_session_factory() as session:
            # Try to find active cart
            stmt = (
                select(Cart)
                .options(selectinload(Cart.items).selectinload(CartItem.product))
                .where(Cart.customer_id == customer_id)
            )
            result = await session.execute(stmt)
            cart = result.scalar_one_or_none()

            # If cart exists but expired, delete it and create a new one
            if cart and cart.expires_at < datetime.now(timezone.utc):
                await session.delete(cart)
                await session.commit()
                cart = None

            if not cart:
                cart = Cart(
                    customer_id=customer_id,
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=4)
                )
                session.add(cart)
                await session.commit()
                # Re-fetch to ensure relations are loaded
                result = await session.execute(stmt)
                cart = result.scalar_one_or_none()

            return cart

    @staticmethod
    async def add_to_cart(customer_id: uuid.UUID, product_id: uuid.UUID) -> Cart:
        cart = await CartService.get_or_create_cart(customer_id)
        
        async with async_session_factory() as session:
            session.add(cart)  # Attach to session
            
            # Check if product is already in cart
            existing_item = next((item for item in cart.items if item.product_id == product_id), None)
            
            if existing_item:
                existing_item.quantity += 1
            else:
                new_item = CartItem(cart_id=cart.id, product_id=product_id, quantity=1)
                session.add(new_item)
                cart.items.append(new_item)

            await session.commit()
            
            # Fetch fresh cart
            stmt = (
                select(Cart)
                .options(selectinload(Cart.items).selectinload(CartItem.product))
                .where(Cart.id == cart.id)
            )
            result = await session.execute(stmt)
            return result.scalar_one()

    @staticmethod
    async def clear_cart(customer_id: uuid.UUID) -> None:
        async with async_session_factory() as session:
            stmt = select(Cart).where(Cart.customer_id == customer_id)
            result = await session.execute(stmt)
            cart = result.scalar_one_or_none()
            if cart:
                await session.delete(cart)
                await session.commit()

    @staticmethod
    async def get_cart_summary(customer_id: uuid.UUID) -> str:
        cart = await CartService.get_or_create_cart(customer_id)
        if not cart.items:
            return "🛒 Your cart is currently empty."
            
        summary = "🛒 *Your Cart*\n\n"
        total = 0
        for item in cart.items:
            product_total = item.product.price * item.quantity
            total += product_total
            variant = f" ({item.product.variant})" if item.product.variant else ""
            summary += f"• {item.quantity}x {item.product.name}{variant} - ₹{product_total}\n"
            
        summary += f"\n*Total: ₹{total}*"
        return summary
