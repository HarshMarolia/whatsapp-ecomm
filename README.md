# whatsapp-ecomm

## Docker Setup & Local Development

This project is fully dockerized with separate containers for the frontend and backend.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.
- A running PostgreSQL database (local or cloud-hosted).
- Populated `.env` files in `./backend` and `./frontend` (see `.env.example` in the backend for reference).

### Quick Start

1. Open a terminal in the root directory (`whatsapp-ecomm`).
2. Run the following command to build the images and start the containers in the background:
   ```bash
   docker-compose up -d --build
   ```
3. Access your applications:
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:8000](http://localhost:8000) (or `http://localhost:8000/docs` for Swagger UI)

### Architecture
- **Backend:** Python FastAPI running on a slim Python 3.11 image, using `uv` for package management.
- **Frontend:** Next.js application using a multi-stage optimized node image.
- **Database:** External PostgreSQL instance (not bundled). Connection is configured via `DATABASE_URL` in `./backend/.env`.

### Environment Variables
All environment variables are loaded from the `.env` files in their respective directories:
- `./backend/.env` — Backend config (DB URL, Clerk, Cloudinary, WhatsApp keys, etc.)
- `./frontend/.env` — Frontend config (Clerk publishable key, API URL, etc.)

> **Using a local database?**
> Inside Docker, `localhost` refers to the container itself, not your machine.
> Change the host in `DATABASE_URL` to `host.docker.internal` to connect to a database running on your Windows host:
> ```
> DATABASE_URL=postgresql+asyncpg://user:password@host.docker.internal:5432/whatsapp_ecomm
> ```
