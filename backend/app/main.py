from contextlib import asynccontextmanager

import anyio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth.clerk import ClerkAuth
from app.config import settings
from app.database import engine
from app.exceptions import AppException
from app.routes.health import router as health_router
from app.routes.authenticated.customers import router as customers_router
from app.routes.authenticated.orders import router as orders_router
from app.routes.authenticated.products import router as products_router
from app.routes.public.whatsapp import router as whatsapp_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    clerk_auth = ClerkAuth(settings.clerk_jwks_url)
    await anyio.to_thread.run_sync(clerk_auth.pre_warm_cache)

    yield

    await engine.dispose()


app = FastAPI(title="WhatsApp Ecomm API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.message, "code": exc.code},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "code": "INTERNAL_ERROR"},
    )


app.include_router(health_router)
app.include_router(products_router, prefix=settings.api_prefix)
app.include_router(customers_router, prefix=settings.api_prefix)
app.include_router(orders_router, prefix=settings.api_prefix)
app.include_router(whatsapp_router)
