import uuid

from app.exceptions import CustomerNotFoundError
from app.models.customer import Customer
from app.repositories.customer_repository import CustomerRepository
from app.schemas.customer import CustomerCreateRequest, CustomerUpdateRequest
from app.services.base import BaseService


class CustomerService(BaseService):
    def __init__(self, customer_repo: CustomerRepository) -> None:
        self.customer_repo = customer_repo

    async def get_or_create(self, data: CustomerCreateRequest) -> tuple[Customer, bool]:
        existing = await self.customer_repo.get_by_whatsapp_number(data.whatsapp_number)
        if existing:
            return existing, False
        customer = Customer(whatsapp_number=data.whatsapp_number, name=data.name)
        return await self.customer_repo.create(customer), True

    async def get_customer(self, customer_id: uuid.UUID) -> Customer:
        customer = await self.customer_repo.get_by_id(customer_id)
        if not customer:
            raise CustomerNotFoundError()
        return customer

    async def list_customers(self) -> list[Customer]:
        return await self.customer_repo.get_all()

    async def update_customer(self, customer_id: uuid.UUID, data: CustomerUpdateRequest) -> Customer:
        customer = await self.customer_repo.get_by_id(customer_id)
        if not customer:
            raise CustomerNotFoundError()

        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(customer, field, value)

        return await self.customer_repo.update(customer)

    async def update_conversation_state(self, customer_id: uuid.UUID, state: str | None) -> Customer:
        customer = await self.customer_repo.get_by_id(customer_id)
        if not customer:
            raise CustomerNotFoundError()
        customer.conversation_state = state
        return await self.customer_repo.update(customer)

    async def update_delivery_address_text(self, customer_id: uuid.UUID, address_text: str) -> Customer:
        customer = await self.customer_repo.get_by_id(customer_id)
        if not customer:
            raise CustomerNotFoundError()
        customer.delivery_address = {"text": address_text}
        return await self.customer_repo.update(customer)
