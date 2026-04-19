from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.clerk import ClerkAuth
from app.config import settings
from app.database import get_db
from app.repositories.customer_repository import CustomerRepository
from app.repositories.product_repository import ProductRepository
from app.services.customer_service import CustomerService
from app.services.product_service import ProductService

_security = HTTPBearer()
_clerk_auth: ClerkAuth | None = None


def _get_clerk_auth() -> ClerkAuth:
    global _clerk_auth
    if _clerk_auth is None:
        _clerk_auth = ClerkAuth(settings.clerk_jwks_url)
    return _clerk_auth


def get_current_clerk_user_id(
    credentials: HTTPAuthorizationCredentials = Security(_security),
) -> str:
    clerk_auth = _get_clerk_auth()
    payload = clerk_auth.verify_token(credentials.credentials)
    return payload["sub"]


def get_product_repository(session: AsyncSession = Depends(get_db)) -> ProductRepository:
    return ProductRepository(session)


def get_product_service(
    product_repo: ProductRepository = Depends(get_product_repository),
) -> ProductService:
    return ProductService(product_repo)


def get_customer_repository(session: AsyncSession = Depends(get_db)) -> CustomerRepository:
    return CustomerRepository(session)


def get_customer_service(
    customer_repo: CustomerRepository = Depends(get_customer_repository),
) -> CustomerService:
    return CustomerService(customer_repo)
