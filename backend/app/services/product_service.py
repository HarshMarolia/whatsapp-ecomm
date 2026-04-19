import random
import string
import uuid

from app.exceptions import ProductNotFoundError
from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreateRequest, ProductUpdateRequest
from app.services.base import BaseService


def _generate_fallback_id(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


class ProductService(BaseService):
    def __init__(self, product_repo: ProductRepository) -> None:
        self.product_repo = product_repo

    async def create_product(self, data: ProductCreateRequest) -> Product:
        fallback_id = _generate_fallback_id()
        product = Product(
            name=data.name,
            price=data.price,
            variant=data.variant,
            inventory=data.inventory,
            original_image_url=data.original_image_url,
            fallback_product_id=fallback_id,
        )
        return await self.product_repo.create(product)

    async def get_product(self, product_id: uuid.UUID) -> Product:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ProductNotFoundError()
        return product

    async def list_products(self, include_inactive: bool = False) -> list[Product]:
        return await self.product_repo.get_all(include_inactive=include_inactive)

    async def update_product(self, product_id: uuid.UUID, data: ProductUpdateRequest) -> Product:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ProductNotFoundError()

        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(product, field, value)

        return await self.product_repo.update(product)

    async def delete_product(self, product_id: uuid.UUID) -> None:
        from app.utils.timezone import utc_now
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ProductNotFoundError()
        product.deleted_at = utc_now()
        await self.product_repo.update(product)
