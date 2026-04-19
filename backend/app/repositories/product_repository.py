import uuid

from sqlalchemy import select

from app.models.product import Product
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository):

    async def create(self, product: Product) -> Product:
        self.session.add(product)
        await self.session.flush()
        await self.session.refresh(product)
        return product

    async def get_by_id(self, product_id: uuid.UUID) -> Product | None:
        result = await self.session.execute(
            select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_fallback_id(self, fallback_id: str) -> Product | None:
        result = await self.session.execute(
            select(Product).where(
                Product.fallback_product_id == fallback_id,
                Product.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_all(self, include_inactive: bool = False) -> list[Product]:
        query = select(Product).where(Product.deleted_at.is_(None))
        if not include_inactive:
            query = query.where(Product.is_active.is_(True))
        query = query.order_by(Product.created_at.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update(self, product: Product) -> Product:
        await self.session.flush()
        await self.session.refresh(product)
        return product
