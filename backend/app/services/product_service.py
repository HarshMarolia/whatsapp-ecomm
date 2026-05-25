import random
import string
import uuid

import httpx

from app.config import settings
from app.exceptions import ProductNotFoundError, QRGenerationError
from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreateRequest, ProductUpdateRequest
from app.services.base import BaseService
from app.utils.cloudinary_client import delete_image, upload_image
from app.utils.qr import embed_qr


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

        urls_to_delete = [product.original_image_url]
        if product.qr_image_url:
            urls_to_delete.append(product.qr_image_url)

        product.deleted_at = utc_now()
        await self.product_repo.update(product)

        for url in urls_to_delete:
            await delete_image(url)

    async def generate_qr(self, product_id: uuid.UUID) -> Product:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ProductNotFoundError()

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(product.original_image_url)
                response.raise_for_status()
            image_bytes = response.content

            import urllib.parse
            payload_text = f"I want to buy {product.name} [ID: {product.fallback_product_id}]"
            encoded_text = urllib.parse.quote(payload_text)
            payload_url = f"{settings.whatsapp_wa_me_link}?text={encoded_text}"

            qr_bytes = embed_qr(
                image_bytes,
                payload=payload_url,
                corner=settings.qr_corner,
                size_fraction=settings.qr_size_fraction,
                padding=settings.qr_padding,
            )

            qr_url = await upload_image(qr_bytes, public_id=f"products/qr/{product.id}")
        except Exception as exc:
            raise QRGenerationError() from exc

        product.qr_image_url = qr_url
        product.qr_payload = payload_url
        return await self.product_repo.update(product)
