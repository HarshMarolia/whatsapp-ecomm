# Backend Coding Guidelines

> Extracted from the Willpawer FastAPI backend. Use these patterns as a reference template for new projects.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Configuration & Settings](#configuration--settings)
3. [Database Setup](#database-setup)
4. [Models (SQLAlchemy)](#models-sqlalchemy)
5. [Schemas (Pydantic)](#schemas-pydantic)
6. [Repositories](#repositories)
7. [Services](#services)
8. [Route Handlers](#route-handlers)
9. [Authentication (Clerk JWT)](#authentication-clerk-jwt)
10. [Dependency Injection](#dependency-injection)
11. [Error Handling](#error-handling)
12. [Response Structure](#response-structure)
13. [Cron Jobs (APScheduler)](#cron-jobs-apscheduler)
14. [Utilities](#utilities)
15. [App Entry Point](#app-entry-point)
16. [Naming Conventions](#naming-conventions)

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, lifespan, middleware, router registration
│   ├── config.py                # Pydantic Settings with LRU cache
│   ├── database.py              # Async engine, session factory, get_db dependency
│   ├── auth/
│   │   └── clerk.py             # ClerkAuth: JWKS fetching, JWT verification
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── base.py              # TimestampMixin (id, created_at, updated_at)
│   │   └── <entity>.py
│   ├── schemas/                 # Pydantic request/response models
│   │   ├── base.py              # SuccessResponse[T], ErrorResponse
│   │   └── <entity>.py
│   ├── repositories/            # Data access layer (DB queries only)
│   │   ├── base.py              # BaseRepository
│   │   └── <entity>_repository.py
│   ├── services/                # Business logic layer
│   │   ├── base.py              # BaseService
│   │   └── <entity>_service.py
│   ├── routes/
│   │   ├── health.py            # Public health-check endpoint
│   │   └── authenticated/       # All JWT-protected routes
│   │       └── <entity>.py
│   ├── crons/
│   │   ├── scheduler.py         # APScheduler setup
│   │   └── <job_name>.py        # Individual cron jobs
│   ├── exceptions.py            # Custom exception hierarchy
│   ├── dependencies.py          # FastAPI Depends() factories
│   └── utils/
│       └── timezone.py          # Pure timezone helper functions
├── alembic/                     # DB migrations
├── tests/
├── .env
├── .env.example
├── alembic.ini
└── pyproject.toml
```

---

## Configuration & Settings

Use `pydantic_settings.BaseSettings` with an LRU-cached getter. The singleton pattern avoids re-parsing `.env` on every import.

```python
# app/config.py
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    clerk_secret_key: str
    clerk_publishable_key: str
    clerk_jwks_url: str
    environment: str = "development"
    api_prefix: str = "/api"
    allowed_origins: list[str] = ["http://localhost:8081"]

    # Optional integrations — give them safe defaults
    openai_api_key: str = ""
    some_feature_flag: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",   # silently ignore unknown env vars
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
```

**Rules:**
- Never hardcode secrets — always read from env.
- Use `extra="ignore"` so CI can set additional env vars without breaking startup.
- Provide type-safe defaults for optional values (`str = ""`, `bool = False`).

---

## Database Setup

```python
# app/database.py
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


engine = create_async_engine(settings.database_url, echo=False)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,   # avoids detached-instance errors after commit
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields a session, commits on success, rolls back on error."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

**Rules:**
- Commit **only at the request boundary** inside `get_db()`. Repositories use `flush()`, not `commit()`.
- `expire_on_commit=False` is required to access model attributes after a commit without another round-trip.
- `echo=False` in production; enable temporarily for debugging.

---

## Models (SQLAlchemy)

### Base Mixin

```python
# app/models/base.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class TimestampMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
```

### Entity Model

```python
# app/models/task.py
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DATE, DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User   # avoid circular imports


class Task(TimestampMixin, Base):
    __tablename__ = "tasks"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    frequency: Mapped[str] = mapped_column(String(20), nullable=False)
    start_date: Mapped[date] = mapped_column(DATE, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped[User] = relationship(back_populates="tasks")

    # Indexes for common query patterns
    __table_args__ = (
        Index("ix_tasks_user_id_deleted_at", "user_id", "deleted_at"),
    )
```

**Rules:**
- Always inherit `TimestampMixin` — it provides `id`, `created_at`, `updated_at`.
- UUID primary keys everywhere; use `UUID(as_uuid=True)` for PostgreSQL.
- Use `TYPE_CHECKING` guard for relationships to prevent circular imports.
- Foreign keys declare `ondelete="CASCADE"` and relationships declare `cascade="all, delete-orphan"`.
- Use composite `Index()` objects inside `__table_args__` for multi-column indexes.
- Soft delete via `deleted_at: Mapped[datetime | None]` — never hard-delete user-visible records.
- All datetime columns must use `DateTime(timezone=True)` (`TIMESTAMPTZ` in PostgreSQL).

---

## Schemas (Pydantic)

### Base Response Wrapper

```python
# app/schemas/base.py
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: str = "OK"


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    code: str
```

### Request & Response Models

```python
# app/schemas/task.py
from datetime import date
from typing import Literal
import uuid
from pydantic import BaseModel, ConfigDict, field_validator


class TaskCreateRequest(BaseModel):
    description: str
    frequency: Literal["daily", "weekdays"]

    @field_validator("description")
    @classmethod
    def description_min_length(cls, v: str) -> str:
        if len(v.strip()) < 15:
            raise ValueError("Task description must be at least 15 characters")
        return v.strip()


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    description: str
    frequency: str
    start_date: date
```

**Rules:**
- Keep request and response models in separate classes — never reuse one for both.
- Use `Literal[...]` for constrained string fields instead of plain `str`.
- Use `@field_validator` for domain validation (length, format, allowed values).
- All response models set `model_config = ConfigDict(from_attributes=True)` to support ORM → Pydantic conversion.
- Route `response_model` is always `SuccessResponse[YourResponseModel]`.

---

## Repositories

Repositories contain **only database queries** — no business logic.

```python
# app/repositories/base.py
from sqlalchemy.ext.asyncio import AsyncSession


class BaseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
```

```python
# app/repositories/task_repository.py
import uuid
from sqlalchemy import select
from app.models.task import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository):

    async def get_active_tasks_for_user(self, user_id: uuid.UUID) -> list[Task]:
        result = await self.session.execute(
            select(Task)
            .where(Task.user_id == user_id, Task.deleted_at.is_(None))
            .order_by(Task.created_at)
        )
        return list(result.scalars().all())

    async def create(self, task: Task) -> Task:
        self.session.add(task)
        await self.session.flush()   # flush, not commit — commit happens in get_db()
        await self.session.refresh(task)
        return task

    async def get_by_id_locked(self, task_id: uuid.UUID) -> Task | None:
        """Select with FOR UPDATE for pessimistic locking on concurrent writes."""
        result = await self.session.execute(
            select(Task).where(Task.id == task_id).with_for_update()
        )
        return result.scalar_one_or_none()
```

**Rules:**
- Use `flush()` inside repositories, never `commit()`.
- Use `.with_for_update()` on queries that precede a write when concurrent modification is a concern.
- Return `None` on not-found rather than raising — let the service decide whether to raise.
- Always return typed results; avoid bare `execute()` results.

---

## Services

Services contain **all business logic**. Route handlers are thin HTTP wrappers.

```python
# app/services/base.py
class BaseService:
    pass
```

```python
# app/services/task_service.py
import uuid
from datetime import date, timedelta
from zoneinfo import ZoneInfo

from app.exceptions import TaskSlotsFullError, TaskNotFoundError
from app.models.task import Task
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.task import TaskCreateRequest
from app.services.base import BaseService
from app.utils.timezone import today_in_timezone

TRIVIAL_KEYWORDS = {"drink water", "brush teeth", "shower"}
MAX_TASK_SLOTS = 3


class TaskService(BaseService):
    def __init__(
        self,
        task_repo: TaskRepository,
        user_repo: UserRepository,
    ) -> None:
        self.task_repo = task_repo
        self.user_repo = user_repo

    async def create_task(self, user_id: uuid.UUID, data: TaskCreateRequest) -> Task:
        user = await self.user_repo.get_by_id(user_id)
        active_tasks = await self.task_repo.get_active_tasks_for_user(user_id)

        available_slots = min(1 + (user.streak // 7), MAX_TASK_SLOTS)
        if len(active_tasks) >= available_slots:
            raise TaskSlotsFullError()

        self._validate_description(data.description)

        start_date = self._compute_start_date(data.frequency, user.timezone)

        task = Task(
            user_id=user_id,
            description=data.description,
            frequency=data.frequency,
            start_date=start_date,
        )
        return await self.task_repo.create(task)

    def _validate_description(self, description: str) -> None:
        lower = description.lower()
        for keyword in TRIVIAL_KEYWORDS:
            if keyword in lower:
                raise ValueError(f"Task description contains trivial keyword: {keyword}")

    def _compute_start_date(self, frequency: str, timezone_str: str) -> date:
        today = today_in_timezone(timezone_str)
        tomorrow = today + timedelta(days=1)
        if frequency == "weekdays" and tomorrow.weekday() >= 5:
            days_until_monday = 7 - tomorrow.weekday()
            return tomorrow + timedelta(days=days_until_monday)
        return tomorrow
```

**Rules:**
- Services receive repositories via `__init__` — never instantiate repos inside service methods.
- Private helpers are prefixed with `_`.
- Raise custom exceptions (from `app/exceptions.py`) for business rule violations.
- Never perform HTTP or direct DB commits inside a service.

---

## Route Handlers

```python
# app/routes/authenticated/tasks.py
from fastapi import APIRouter, Depends

from app.dependencies import get_current_clerk_user_id, get_task_service, get_user_service
from app.schemas.base import SuccessResponse
from app.schemas.task import TaskCreateRequest, TaskResponse
from app.services.task_service import TaskService
from app.services.user_service import UserService

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=SuccessResponse[list[TaskResponse]])
async def list_tasks(
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    user_service: UserService = Depends(get_user_service),
    task_service: TaskService = Depends(get_task_service),
):
    user = await user_service.get_current_user(clerk_user_id)
    tasks = await task_service.get_active_tasks(user.id)
    return SuccessResponse(data=[TaskResponse.model_validate(t) for t in tasks])


@router.post("", response_model=SuccessResponse[TaskResponse], status_code=201)
async def create_task(
    data: TaskCreateRequest,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    user_service: UserService = Depends(get_user_service),
    task_service: TaskService = Depends(get_task_service),
):
    user = await user_service.get_current_user(clerk_user_id)
    task = await task_service.create_task(user.id, data)
    return SuccessResponse(data=TaskResponse.model_validate(task), message="Task created")
```

**Rules:**
- Route handlers do exactly three things: resolve the user, call a service, return a response.
- Always wrap responses in `SuccessResponse[T]`.
- Use explicit `status_code=201` for creation endpoints.
- Declare each service dependency separately — one `Depends()` per service.
- Resolve the Clerk user ID first, then fetch the DB user via `user_service`.

---

## Authentication (Clerk JWT)

```python
# app/auth/clerk.py
import jwt
from jwt import PyJWKClient


class ClerkAuth:
    def __init__(self, jwks_url: str) -> None:
        self._jwks_client = PyJWKClient(
            jwks_url,
            cache_jwk_set=True,
            lifespan=300,  # cache keys for 5 minutes
        )

    def pre_warm_cache(self) -> None:
        """Call once at startup (in a thread pool) to avoid cold-start latency."""
        self._jwks_client.get_jwk_set()

    def verify_token(self, token: str) -> dict:
        signing_key = self._jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
            leeway=60,  # 60-second clock skew tolerance
        )
```

```python
# app/dependencies.py (auth portion)
from fastapi import Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.clerk import ClerkAuth
from app.config import settings

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
```

---

## Dependency Injection

All dependencies are declared in a single `dependencies.py` file.

```python
# app/dependencies.py
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.services.task_service import TaskService
from app.services.user_service import UserService


# --- Repository factories ---

def get_task_repository(session: AsyncSession = Depends(get_db)) -> TaskRepository:
    return TaskRepository(session)


def get_user_repository(session: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(session)


# --- Service factories ---

def get_task_service(
    task_repo: TaskRepository = Depends(get_task_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> TaskService:
    return TaskService(task_repo, user_repo)


def get_user_service(
    user_repo: UserRepository = Depends(get_user_repository),
) -> UserService:
    return UserService(user_repo)
```

**Rules:**
- All dependency factories live in `dependencies.py` — never declare them inside route files.
- Repository → Service → Route handler is the only allowed dependency direction.
- Expensive singleton objects (auth clients, ML clients) use a module-level `_var` with a lazy init function, not `lru_cache`, so they can be replaced in tests.

---

## Error Handling

### Custom Exception Hierarchy

```python
# app/exceptions.py
from fastapi import status


class AppException(Exception):
    message: str = "An unexpected error occurred"
    code: str = "INTERNAL_ERROR"
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.__class__.message
        super().__init__(self.message)


class NotFoundError(AppException):
    message = "Resource not found"
    code = "NOT_FOUND"
    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(AppException):
    message = "Resource already exists"
    code = "CONFLICT"
    status_code = status.HTTP_409_CONFLICT


class ForbiddenError(AppException):
    message = "Access denied"
    code = "FORBIDDEN"
    status_code = status.HTTP_403_FORBIDDEN


# Domain-specific exceptions
class TaskSlotsFullError(AppException):
    message = "All task slots are currently in use"
    code = "TASK_SLOTS_FULL"
    status_code = status.HTTP_400_BAD_REQUEST


class TaskNotFoundError(NotFoundError):
    message = "Task not found"
    code = "TASK_NOT_FOUND"
```

### Global Exception Handler

```python
# app/main.py (handler registration)
from fastapi import Request
from fastapi.responses import JSONResponse
from app.exceptions import AppException


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
```

**Rules:**
- All domain errors inherit from `AppException` — never raise raw `HTTPException` inside services.
- Route handlers may raise `HTTPException` only for HTTP-level concerns (e.g., missing auth header).
- Never expose stack traces or internal error messages to the client in production.

---

## Response Structure

Every endpoint returns one of two consistent shapes:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Task slots are full",
  "code": "TASK_SLOTS_FULL"
}
```

**HTTP status codes:**
| Scenario | Code |
|---|---|
| Read / update success | 200 |
| Create success | 201 |
| Validation / business rule violation | 400 |
| Unauthenticated | 401 |
| Forbidden | 403 |
| Not found | 404 |
| Conflict (duplicate resource) | 409 |
| Server error | 500 |

---

## Cron Jobs (APScheduler)

```python
# app/crons/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.crons.streak_checker import check_streaks
from app.crons.token_refresh import refresh_forgiveness_tokens


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        check_streaks,
        CronTrigger(minute=0),   # every hour on the hour
        id="streak_checker",
        replace_existing=True,
    )
    scheduler.add_job(
        refresh_forgiveness_tokens,
        CronTrigger(minute=0),
        id="token_refresh",
        replace_existing=True,
    )
    return scheduler
```

```python
# app/crons/streak_checker.py
import logging
from datetime import datetime, timezone

from app.database import async_session_factory
from app.repositories.streak_repository import StreakRepository
from app.repositories.user_repository import UserRepository
from app.services.streak_service import StreakService
from app.utils.timezone import now_in_timezone

logger = logging.getLogger(__name__)


async def check_streaks() -> None:
    logger.info("streak_checker: starting run at %s", datetime.now(timezone.utc).isoformat())
    async with async_session_factory() as session:
        try:
            user_repo = UserRepository(session)
            streak_repo = StreakRepository(session)
            streak_service = StreakService(streak_repo)

            users = await user_repo.get_all_active()
            for user in users:
                try:
                    local_now = now_in_timezone(user.timezone)
                    if local_now.hour != 0:
                        continue    # only process users in their 00:00–01:00 window
                    await streak_service.process_midnight(user)
                except Exception:
                    logger.exception("streak_checker: error processing user %s", user.id)

            await session.commit()
        except Exception:
            await session.rollback()
            logger.exception("streak_checker: fatal error, rolled back")
```

**Rules:**
- Create repositories and services locally inside cron functions — dependency injection is not available.
- Wrap the entire cron body in `try/except` with a rollback. Catch per-user exceptions separately so one bad user doesn't stop the batch.
- Log every cron execution with a UTC timestamp.
- Never use `time.sleep()` or blocking calls inside cron handlers.
- Commit manually at the end (unlike request handlers, there is no `get_db()` wrapper).

---

## Utilities

Utilities are **pure functions** — no classes, no side effects.

```python
# app/utils/timezone.py
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo


def now_in_timezone(timezone_str: str) -> datetime:
    return datetime.now(ZoneInfo(timezone_str))


def today_in_timezone(timezone_str: str) -> date:
    return now_in_timezone(timezone_str).date()


def is_valid_timezone(timezone_str: str) -> bool:
    try:
        ZoneInfo(timezone_str)
        return True
    except (KeyError, Exception):
        return False


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
```

---

## App Entry Point

```python
# app/main.py
from contextlib import asynccontextmanager
import anyio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.clerk import ClerkAuth
from app.config import settings
from app.crons.scheduler import create_scheduler
from app.database import engine
from app.exceptions import AppException
from app.routes.health import router as health_router
from app.routes.authenticated.tasks import router as tasks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    clerk_auth = ClerkAuth(settings.clerk_jwks_url)
    await anyio.to_thread.run_sync(clerk_auth.pre_warm_cache)
    scheduler = create_scheduler()
    scheduler.start()

    yield

    # Shutdown
    scheduler.shutdown(wait=True)
    await engine.dispose()


app = FastAPI(title="My API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(AppException)
async def app_exception_handler(request, exc: AppException):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.message, "code": exc.code},
    )

# Routers
app.include_router(health_router)
app.include_router(tasks_router, prefix=settings.api_prefix)
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | `snake_case` | `task_service.py` |
| Classes | `PascalCase` | `TaskService`, `TaskRepository` |
| Functions / methods | `snake_case` | `get_active_tasks()` |
| Private helpers | `_snake_case` prefix | `_validate_description()` |
| Module-level singletons | `_snake_case` prefix | `_clerk_auth` |
| Route files | `<entity>.py` | `tasks.py` |
| Repository classes | `<Entity>Repository` | `TaskRepository` |
| Service classes | `<Entity>Service` | `TaskService` |
| Request schemas | `<Entity>CreateRequest`, `<Entity>UpdateRequest` | `TaskCreateRequest` |
| Response schemas | `<Entity>Response` | `TaskResponse` |
| Exception classes | `<Reason>Error` | `TaskSlotsFullError` |
| DB table names | `snake_case` plural | `tasks`, `forgiveness_tokens` |
| Index names | `ix_<table>_<cols>` | `ix_tasks_user_id_deleted_at` |
| Cron job IDs | `snake_case` | `streak_checker` |

---

## Quick Reference: Dependency Direction

```
Route handler
    └── Depends(get_X_service)
            └── Depends(get_X_repository)
                    └── Depends(get_db)   →   AsyncSession
```

Never skip a layer (e.g., repositories directly in route handlers) and never reverse it (e.g., services importing route logic).
