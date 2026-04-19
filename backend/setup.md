# Backend Setup

## 1. PostgreSQL (Docker)

```bash
docker run --name whatsappecomm_postgres \
  -e POSTGRES_USER=whatsappecomm \
  -e POSTGRES_PASSWORD=whatsappecomm123 \
  -e POSTGRES_DB=whatsapp_ecomm \
  -p 5436:5432 \
  -d postgres
```

DATABASE_URL for `.env`:
```
DATABASE_URL=postgresql+asyncpg://whatsappecomm:whatsappecomm123@localhost:5436/whatsapp_ecomm
```

## 2. Install dependencies

```bash
uv sync
```

## 3. Run migrations

```bash
uv run alembic upgrade head
```

## 4. Start the server

```bash
uv run uvicorn app.main:app --reload
```
