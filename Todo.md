# Todo

Remaining implementation work, in delivery order. Each phase builds on the previous.

---

## Phase 3 — Cart & Ordering

**Target:** `v1.3.0`

### Cart module (`src/modules/cart/`)

- [ ] Create `convex/cart.ts` with:
  - `getActiveCart(userId)` — query: cart + items for a user where status = `active`
  - `createCart(userId, pharmacyId)` — mutation
  - `addItem(cartId, medicationId, inventoryId, quantity)` — mutation; validate against `inventory.quantity` and `isAvailable` before inserting
  - `updateItem(cartItemId, quantity)` — mutation; 0 quantity should remove the item
  - `removeItem(cartItemId)` — mutation
  - `clearCart(cartId)` — mutation; deletes all `cartItems`, sets cart `status = abandoned`
- [ ] Create `src/modules/cart/model.ts` — TypeBox schemas for add/update item bodies, cart response
- [ ] Create `src/modules/cart/service.ts`
- [ ] Create `src/modules/cart/index.ts` — routes (all require `auth: true`):
  - `GET    /cart` — get current active cart (create one if none exists)
  - `POST   /cart/item` — add item `{ medicationId, pharmacyId, quantity }`
  - `PUT    /cart/item/:id` — update quantity
  - `DELETE /cart/item/:id` — remove item
  - `DELETE /cart` — clear entire cart
- [ ] Register cart plugin in `src/modules/index.ts`
- [ ] Enforce single-pharmacy rule: adding an item from a different pharmacy than the cart's `pharmacyId` should return 400

### Order module (`src/modules/order/`)

- [ ] Create `convex/order.ts` with:
  - `placeOrder(userId, cartId, deliveryAddressId)` — mutation; snapshot item names + prices from `inventory`, decrement `inventory.quantity`, set cart `status = checked_out`, create `orders` + `orderItems` records in a single Convex transaction
  - `listOrders(userId)` — query: orders for user, newest first
  - `getOrder(orderId, userId)` — query: order + items (ownership check)
  - `cancelOrder(orderId, userId)` — mutation; only if `status = pending`; restore inventory quantities
  - `updateOrderStatus(orderId, status)` — mutation (pharmacy/admin use)
- [ ] Create `src/modules/order/model.ts`, `service.ts`, `index.ts` — routes:
  - `POST /order` — place order from cart `{ deliveryAddressId }`
  - `GET  /order` — list my orders
  - `GET  /order/:id` — order detail with items
  - `PUT  /order/:id/cancel` — cancel if pending
  - `PUT  /order/:id/status` — update status (admin gate deferred)
- [ ] Register order plugin in `src/modules/index.ts`

---

## Phase 4 — Payments

**Target:** `v1.4.0`

- [ ] Add Stripe SDK: `bun add stripe`
- [ ] Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env.example` (already documented; verify they're present)
- [ ] Create `convex/payment.ts`:
  - `createPayment(orderId, userId, amount, currency, providerPaymentId)` — mutation
  - `updatePaymentStatus(providerPaymentId, status)` — mutation (called by webhook handler)
  - `getPaymentByOrder(orderId)` — query
- [ ] Create `src/modules/payment/model.ts`, `service.ts`, `index.ts` — routes:
  - `POST /payment/intent` — create a Stripe `PaymentIntent` for an order; store in `payments` table; return `clientSecret`
  - `POST /payment/webhook` — receive Stripe events; **must use raw body** (configure `parse: 'text'` or `parse: 'arrayBuffer'` on the Elysia route, not JSON); validate `stripe-signature` header with `stripe.webhooks.constructEvent`
  - `POST /payment/:orderId/refund` — issue Stripe refund, update `payments.status = refunded` and `orders.paymentStatus = refunded`
- [ ] On `payment_intent.succeeded` webhook event: set `orders.paymentStatus = paid`, advance order `status` from `pending` → `confirmed`
- [ ] On `payment_intent.payment_failed`: set `orders.paymentStatus` accordingly, leave order `status = pending`
- [ ] Register payment plugin in `src/modules/index.ts`

---

## Phase 5 — Delivery Tracking

**Target:** `v1.5.0`

- [ ] Create `convex/delivery.ts`:
  - `createDelivery(orderId)` — mutation; called when order moves to `confirmed`; creates a `deliveries` record with `status = pending`
  - `getDeliveryByOrder(orderId)` — query
  - `updateCourierLocation(deliveryId, lat, lng)` — mutation
  - `updateDeliveryStatus(deliveryId, status, deliveredAt?)` — mutation
- [ ] Wire `createDelivery` call into `convex/order.ts` `updateOrderStatus` handler: when status transitions to `confirmed`, auto-create delivery record
- [ ] Create `src/modules/delivery/model.ts`, `service.ts`, `index.ts` — routes:
  - `GET /delivery/:orderId` — get delivery info including courier location and ETA
  - `PUT /delivery/:id/location` — update courier lat/lng (internal; no public auth gate yet)
- [ ] Register delivery plugin in `src/modules/index.ts`
- [ ] Include delivery status in `GET /order/:id` response (join in Convex query or service layer)

---

## Phase 6 — OCR & Prescription Scanning

**Target:** `v1.6.0`

- [ ] Add `GOOGLE_CLOUD_VISION_API_KEY` to `.env.example` (already documented; verify)
- [ ] Create `convex/prescription.ts`:
  - `createPrescription(userId, imageStorageId)` — mutation; status = `pending`
  - `updatePrescription(id, ocrRawText, extractedItems, status)` — mutation
  - `getPrescription(id, userId)` — query with ownership check
  - `listPrescriptions(userId)` — query
- [ ] Set up Convex file storage for prescription images (use `ctx.storage` in mutations)
- [ ] Create `src/modules/prescription/service.ts` with:
  - OCR provider abstraction: `interface OcrProvider { scan(imageBase64: string): Promise<string> }`
  - Google Cloud Vision implementation (primary)
  - Tesseract.js implementation (offline fallback, for dev when `GOOGLE_CLOUD_VISION_API_KEY` is absent)
  - Medication name extraction from raw OCR text (regex heuristics + LLM optional)
  - Fuzzy match against medications catalog: Convex `search_name` searchIndex first, Levenshtein distance fallback for unmatched tokens
- [ ] Create `src/modules/prescription/model.ts`, `index.ts` — routes:
  - `POST /prescription/scan` — accept `{ imageBase64: string }`; run OCR; return `{ matched: [...], unmatched: [...] }` with confidence scores
  - `GET  /prescription` — list my scans
  - `GET  /prescription/:id` — single scan detail
- [ ] Register prescription plugin in `src/modules/index.ts`
- [ ] Allow attaching a `prescriptionId` when placing an order (update `POST /order` body schema)

---

## Phase 7 — Mobile Frontend

**Target:** `v1.7.0`

- [ ] Init Expo app: `bunx create-expo-app apps/mobile --template blank-typescript`
- [ ] Configure monorepo workspace in root `package.json`
- [ ] Auth screens: Sign Up, Sign In (hit `/v1/auth/*`, store session cookie in SecureStore)
- [ ] Home screen: map view (`react-native-maps`) centered on user location; markers for nearby pharmacies from `GET /v1/geolocation/nearby`
- [ ] Pharmacy detail screen: hours, open/closed status, inventory list
- [ ] Medication search screen: `GET /v1/medication?q=` with debounced input
- [ ] Cart screen: add/remove items, pharmacy lock warning on mixed selection
- [ ] Checkout screen: delivery address picker, order summary
- [ ] Payment screen: Stripe `<PaymentSheet>` from `@stripe/stripe-react-native`
- [ ] Order history screen: list + status badge
- [ ] Order tracking screen: live courier location on map, ETA
- [ ] Prescription scan screen: Expo Camera → base64 → `POST /v1/prescription/scan` → review matched medications → add to cart

---

## Cross-cutting (any phase)

- [ ] Admin role gate — currently `auth: true` on mutation routes allows any authenticated user to create/update pharmacies, medications, and inventory. Implement a role check: add `role` field to `userProfiles` (`user | admin`), check `user.role === "admin"` in a `beforeHandle` on those routes
- [ ] Update CHANGELOG with Phase 2 release entry (geolocation + inventory are shipped)
- [ ] Write integration tests for all modules (see `TESTS.md`)
- [ ] Scaffold `src/tests/integration/helpers.ts` and the per-module test files from `TESTS.md`
