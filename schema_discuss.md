# Schema Discussion — WhatsApp Image Commerce

> Single-seller assumption: no `sellers` table. Product management endpoints are admin-only, protected by Clerk JWT (matching the coding guideline pattern).

## Decisions Log

| # | Topic | Decision |
|---|---|---|
| 1 | Product variants | Option A — one product row per variant, each with its own QR |
| 2 | QR payload content | Option A — bare `product_id` UUID encoded in QR |
| 3 | Cart reset strategy | Option B — hard delete expired carts + cart_items via cron |
| 4 | Admin/operator auth | Option B — Clerk JWT |
| 5 | Image storage | Cloudinary — URLs stored in DB, assets hosted on Cloudinary |

---

## Proposed Entities

### products
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | |
| price | NUMERIC(10,2) | |
| variant | VARCHAR NULL | e.g. "Red / XL" — one per product row |
| inventory | INTEGER | stock count; no inventory tracking enforced in MVP but field present |
| is_active | BOOLEAN | default `false` — must be explicitly activated before QR is shareable |
| original_image_url | TEXT | Image A (raw upload, Cloudinary URL) |
| qr_image_url | TEXT NULL | Image B (QR-embedded, set by pipeline after upload) |
| qr_payload | TEXT NULL | bare `product_id` UUID — what the QR encodes |
| fallback_product_id | VARCHAR UNIQUE | short alphanumeric for manual lookup |
| deleted_at | TIMESTAMPTZ NULL | soft delete |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Indexes:** `ix_products_deleted_at`, `ix_products_fallback_product_id`

**Notes:**
- `is_active = false` by default means a product is invisible to customers until the operator explicitly activates it after QR generation is complete
- `qr_image_url` and `qr_payload` are `NULL` until the QR pipeline runs — use this to detect incomplete products
- `inventory` is present for future use; no stock-gate logic in MVP

---

### customers
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| whatsapp_number | VARCHAR UNIQUE | E.164 format e.g. +919876543210 |
| name | VARCHAR NULL | populated if WhatsApp profile provides it |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Index:** `ix_customers_whatsapp_number`

---

### carts
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| customer_id | UUID FK → customers | CASCADE delete |
| status | VARCHAR | `active` \| `checked_out` |
| expires_at | TIMESTAMPTZ | created_at + 4 hours |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Index:** `ix_carts_customer_id_status`

**Notes:**
- No `expired` status — expired carts are hard-deleted by the cron job
- Only one `active` cart per customer; enforce via partial unique index on `customer_id` WHERE `status = 'active'`

---

### cart_items
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| cart_id | UUID FK → carts | CASCADE delete |
| product_id | UUID FK → products | |
| quantity | INTEGER | >= 1 |
| price_snapshot | NUMERIC(10,2) | price at time of add — insulates from price changes |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Unique constraint:** `(cart_id, product_id)` — no duplicate rows; quantity incremented instead.

---

### orders
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| customer_id | UUID FK → customers | |
| cart_id | UUID FK → carts NULL | traceability back to originating cart |
| status | VARCHAR | `pending` \| `confirmed` \| `cancelled` |
| total_amount | NUMERIC(10,2) | sum of order_items at checkout time |
| delivery_address | JSONB | `{ name, line1, line2, city, pincode, phone }` |
| payment_method | VARCHAR | `COD` only in MVP |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Index:** `ix_orders_customer_id`

---

### order_items
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| order_id | UUID FK → orders | CASCADE delete |
| product_id | UUID FK → products | |
| quantity | INTEGER | |
| price_snapshot | NUMERIC(10,2) | price at checkout |

---

## ERD (text)

```
products (standalone)
customers ──< carts ──< cart_items >── products
customers ──< orders ──< order_items >── products
carts ──── orders (cart_id on orders for traceability)
```

---

## Cron Jobs Required

| Job | Trigger | Action |
|---|---|---|
| `cart_expiry_checker` | every 15 min | hard-delete carts + cart_items where `expires_at < now()` AND `status = 'active'` |

---

## Constraints Summary

- One active cart per customer at a time (partial unique index)
- One QR per product image (enforced in QR generation service)
- `is_active = false` by default — operator must activate after QR is generated
- `(cart_id, product_id)` unique — quantity incremented, never duplicated
- `price_snapshot` captured at cart-add time and again at order creation
- All datetime columns use `TIMESTAMPTZ`
- Soft delete on products (`deleted_at`); hard deletes never on customer-visible records except expired carts (by design)
- Cloudinary hosts all images; DB stores only URLs
