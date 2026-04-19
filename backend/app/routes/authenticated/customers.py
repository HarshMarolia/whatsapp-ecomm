import uuid

from fastapi import APIRouter, Depends

from app.dependencies import get_customer_service
from app.schemas.base import SuccessResponse
from app.schemas.customer import CustomerCreateRequest, CustomerResponse, CustomerUpdateRequest
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=SuccessResponse[CustomerResponse], status_code=201)
async def get_or_create_customer(
    data: CustomerCreateRequest,
    customer_service: CustomerService = Depends(get_customer_service),
):
    customer, created = await customer_service.get_or_create(data)
    message = "Customer created" if created else "Customer retrieved"
    return SuccessResponse(data=CustomerResponse.model_validate(customer), message=message)


@router.get("", response_model=SuccessResponse[list[CustomerResponse]])
async def list_customers(
    # _: str = Depends(get_current_clerk_user_id),
    customer_service: CustomerService = Depends(get_customer_service),
):
    customers = await customer_service.list_customers()
    return SuccessResponse(data=[CustomerResponse.model_validate(c) for c in customers])


@router.get("/{customer_id}", response_model=SuccessResponse[CustomerResponse])
async def get_customer(
    customer_id: uuid.UUID,
    # _: str = Depends(get_current_clerk_user_id),
    customer_service: CustomerService = Depends(get_customer_service),
):
    customer = await customer_service.get_customer(customer_id)
    return SuccessResponse(data=CustomerResponse.model_validate(customer))


@router.patch("/{customer_id}", response_model=SuccessResponse[CustomerResponse])
async def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdateRequest,
    # _: str = Depends(get_current_clerk_user_id),
    customer_service: CustomerService = Depends(get_customer_service),
):
    customer = await customer_service.update_customer(customer_id, data)
    return SuccessResponse(data=CustomerResponse.model_validate(customer), message="Customer updated")
