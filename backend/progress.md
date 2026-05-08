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

### WhatsApp Webhook
- [x] `app/utils/whatsapp_client.py` — `send_template_message(to)`, `send_text_message(to, text)`, + `download_media(url)` via Graph API v18
- [x] `app/schemas/whatsapp.py` — `WebhookPayload`, `WebhookMessage`, contact/value/status models
- [x] `app/services/webhook_service.py` — `handle_message`: get-or-create customer, decode QR from image in-memory, lookup product, send product details text reply
- [x] `app/routes/public/whatsapp.py` — `GET /webhooks/whatsapp` (hub verification) + `POST /webhooks/whatsapp` (graceful parse, status events ignored)
- [x] WhatsApp config in `app/config.py` — `whatsapp_access_token`, `phone_number_id`, `verify_token`, `template_name`, `template_language`
- [x] Auto-create customer on first WhatsApp message

---

## To Do

### WhatsApp Webhook
- [ ] Swap in real WhatsApp template name + language once Meta-approved template is ready
- [ ] Conversational flow: cart → checkout → order confirmation

### Cart
- [ ] `carts` + `cart_items` tables + models
- [ ] Cart service: create, add item, update quantity, remove item, get active cart
- [ ] Duplicate product detection → prompt to increase quantity instead
- [ ] Cart TTL (4 hours) + `cart_expiry_checker` cron (hard delete)

### Orders
- [ ] `orders` + `order_items` tables + models
- [ ] Order service: create from cart, confirm
- [ ] COD-only checkout flow

### Public Routes
- [ ] `GET /products/{id}` — public product lookup by UUID (for bot)
- [ ] `GET /products/fallback/{fallback_id}` — lookup by short alphanumeric ID
