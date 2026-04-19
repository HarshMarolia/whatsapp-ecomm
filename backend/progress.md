# Backend Progress

## Done

### Infrastructure
- [x] Project scaffold (`pyproject.toml`, `alembic.ini`, `.env.example`)
- [x] `app/config.py` — Settings with Cloudinary + QR config
- [x] `app/database.py` — Async SQLAlchemy engine + `get_db` dependency
- [x] `app/main.py` — FastAPI app, CORS, exception handlers, lifespan
- [x] `app/exceptions.py` — `AppException` hierarchy
- [x] `app/auth/clerk.py` — Clerk JWT verification
- [x] `app/dependencies.py` — DI factories
- [x] `app/schemas/base.py` — `SuccessResponse[T]`, `ErrorResponse`
- [x] `app/utils/timezone.py` — `utc_now()`
- [x] `app/routes/health.py` — `GET /health`

### Products
- [x] `app/models/base.py` — `TimestampBase` abstract class
- [x] `app/models/product.py` — `Product` model (inventory, is_active, soft delete)
- [x] `app/schemas/product.py` — Create / Update / Response / UploadSignature / GenerateQR schemas
- [x] `app/repositories/product_repository.py` — CRUD + `get_by_fallback_id`
- [x] `app/services/product_service.py` — create, get, list, update, delete, generate_qr
- [x] `app/routes/authenticated/products.py` — full CRUD + upload-signature + generate-qr endpoints
- [x] `app/utils/qr.py` — `embed_qr()` — overlays QR at configurable corner/size on image
- [x] `app/utils/cloudinary_client.py` — upload, delete, signature generation
- [x] Alembic migration for `products` table

---

## In Progress
_nothing currently_

---

### Customers
- [x] `app/models/customer.py` — `Customer` model (`whatsapp_number`, `name`, `delivery_address` JSONB)
- [x] `app/schemas/customer.py` — `DeliveryAddress`, Create / Update / Response schemas
- [x] `app/repositories/customer_repository.py` — `get_by_whatsapp_number`, full CRUD
- [x] `app/services/customer_service.py` — `get_or_create`, get, list, update
- [x] `app/routes/authenticated/customers.py` — `POST /customers` (get-or-create), GET list, GET by id, PATCH
- [x] Alembic migration for `customers` table

---

## To Do

### Customers
- [ ] Auto-create customer on first WhatsApp message (wire into webhook)

### Cart
- [ ] `carts` + `cart_items` tables + models
- [ ] Cart service: create, add item, update quantity, remove item, get active cart
- [ ] Duplicate product detection → prompt to increase quantity instead
- [ ] Cart TTL (4 hours) + `cart_expiry_checker` cron (hard delete)

### Orders
- [ ] `orders` + `order_items` tables + models
- [ ] Order service: create from cart, confirm
- [ ] COD-only checkout flow

### WhatsApp Webhook
- [ ] Webhook endpoint (public) for incoming WhatsApp messages
- [ ] QR detection + decoding from received images
- [ ] Conversational flow: product display → cart → checkout → order confirmation
- [ ] WhatsApp Cloud API integration (send messages)

### Public Routes
- [ ] `GET /products/{id}` — public product lookup by UUID (for bot)
- [ ] `GET /products/fallback/{fallback_id}` — lookup by short alphanumeric ID
