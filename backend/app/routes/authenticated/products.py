import uuid

from fastapi import APIRouter, Depends

from app.dependencies import get_current_clerk_user_id, get_product_service
from app.schemas.base import SuccessResponse
from app.schemas.product import (
    GenerateQRResponse,
    ProductCreateRequest,
    ProductResponse,
    ProductUpdateRequest,
    UploadSignatureResponse,
)
from app.services.product_service import ProductService
from app.utils.cloudinary_client import get_upload_signature

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/upload-signature", response_model=SuccessResponse[UploadSignatureResponse])
async def upload_signature(
    # _: str = Depends(get_current_clerk_user_id),
):
    sig = get_upload_signature()
    return SuccessResponse(data=UploadSignatureResponse(**sig))


@router.get("", response_model=SuccessResponse[list[ProductResponse]])
async def list_products(
    include_inactive: bool = False,
    # _: str = Depends(get_current_clerk_user_id),
    product_service: ProductService = Depends(get_product_service),
):
    products = await product_service.list_products(include_inactive=include_inactive)
    return SuccessResponse(data=[ProductResponse.model_validate(p) for p in products])


@router.post("", response_model=SuccessResponse[ProductResponse], status_code=201)
async def create_product(
    data: ProductCreateRequest,
    # _: str = Depends(get_current_clerk_user_id),
    product_service: ProductService = Depends(get_product_service),
):
    product = await product_service.create_product(data)
    return SuccessResponse(data=ProductResponse.model_validate(product), message="Product created")


@router.get("/{product_id}", response_model=SuccessResponse[ProductResponse])
async def get_product(
    product_id: uuid.UUID,
    # _: str = Depends(get_current_clerk_user_id),
    product_service: ProductService = Depends(get_product_service),
):
    product = await product_service.get_product(product_id)
    return SuccessResponse(data=ProductResponse.model_validate(product))


@router.patch("/{product_id}", response_model=SuccessResponse[ProductResponse])
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdateRequest,
    # _: str = Depends(get_current_clerk_user_id),
    product_service: ProductService = Depends(get_product_service),
):
    product = await product_service.update_product(product_id, data)
    return SuccessResponse(data=ProductResponse.model_validate(product), message="Product updated")


@router.delete("/{product_id}", response_model=SuccessResponse[None])
async def delete_product(
    product_id: uuid.UUID,
    # _: str = Depends(get_current_clerk_user_id),
    product_service: ProductService = Depends(get_product_service),
):
    await product_service.delete_product(product_id)
    return SuccessResponse(data=None, message="Product deleted")


@router.post("/{product_id}/generate-qr", response_model=SuccessResponse[GenerateQRResponse])
async def generate_qr(
    product_id: uuid.UUID,
    # _: str = Depends(get_current_clerk_user_id),
    product_service: ProductService = Depends(get_product_service),
):
    product = await product_service.generate_qr(product_id)
    return SuccessResponse(data=GenerateQRResponse.model_validate(product), message="QR generated")
