import uuid

from sqlalchemy import select

from app.models.customer import Customer
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository):

    async def create(self, customer: Customer) -> Customer:
        self.session.add(customer)
        await self.session.flush()
        await self.session.refresh(customer)
        return customer

    async def get_by_id(self, customer_id: uuid.UUID) -> Customer | None:
        result = await self.session.execute(
            select(Customer).where(Customer.id == customer_id)
        )
        return result.scalar_one_or_none()

    async def get_by_whatsapp_number(self, whatsapp_number: str) -> Customer | None:
        result = await self.session.execute(
            select(Customer).where(Customer.whatsapp_number == whatsapp_number)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> list[Customer]:
        result = await self.session.execute(
            select(Customer).order_by(Customer.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, customer: Customer) -> Customer:
        await self.session.flush()
        await self.session.refresh(customer)
        return customer
