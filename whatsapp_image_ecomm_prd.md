# Product Requirements Document (PRD)
## WhatsApp Image-Based Commerce Platform (Updated MVP)

### 1. Overview
This product enables sellers to convert product images into shoppable assets. Users can send
these images on WhatsApp, where a chatbot detects the QR code, retrieves product data,
manages cart, and enables conversational checkout.

### 2. MVP Features

#### 2.1 Seller Features
1. Upload product image
2. Auto-generate QR-embedded image (Image B)
3. Ensure one QR per image (strict validation)
4. Add/edit product details (name, price, variant)
5. Generate fallback product ID

#### 2.2 Customer Features
1. Send product image via WhatsApp
2. QR detection and decoding
3. Show product details
4. Check existing cart for duplicate product
5. Prompt user to increase quantity instead of duplicate addition
6. Cart management within chat
7. Checkout flow
8. COD-only checkout
9. Order confirmation

#### 2.3 Cart Behavior
1. Cart linked to user's WhatsApp number
2. Cart TTL set to 4 hours
3. Auto-resume cart within TTL window
4. Cart reset after TTL expiry to maintain database efficiency

#### 2.4 Backend Features
1. QR detection pipeline
2. Product database
3. Cart session management
4. Order storage
5. Basic logging and analytics

### 3. Constraints & Assumptions
1. Each product image contains only one QR code
2. Users may send compressed or low-quality images
3. Only COD supported in MVP
4. No inventory tracking in MVP

### 4. Future Features
1. UPI / prepaid payments
2. Inventory management
3. Multi-product detection
4. OCR fallback if QR fails
5. AI recommendations
6. Advanced analytics dashboard
7. Multi-platform (Instagram DM)
8. Shipping integrations