# Remote Pharmacy — Development Plan

## 1. Overview

Remote Pharmacy is a mobile utility app that lets users find nearby open pharmacies, check medication availability, order medications for home delivery, and scan prescriptions with OCR. This plan adapts the existing Bun + Elysia + Convex backend template — keeping every existing pattern (module structure, service layer, TypeBox models, Better Auth) and layering the new domain on top.

---

## 2. Project Structure

```
pharmacy/                          # Monorepo root (later)
├── apps/
│   └── mobile/                    # React Native (Expo) — Phase 5+
├── src/
│   ├── index.ts                   # Entry point (unchanged)
│   ├── client.ts                  # ConvexHttpClient (unchanged)
│   └── modules/
│       ├── index.ts               # Mount all plugins here
│       ├── auth/                  # Better Auth (enable existing stubs)
│       ├── user/                  # User profiles, saved addresses
│       ├── pharmacy/              # Pharmacy listings + operating hours
│       ├── geolocation/           # Nearby pharmacy search
│       ├── medication/            # Medications catalog
│       ├── inventory/             # Per-pharmacy stock levels
│       ├── cart/                  # Session/user cart management
│       ├── order/                 # Order placement + lifecycle
│       ├── delivery/              # Delivery tracking
│       ├── payment/               # Stripe integration
│       └── prescription/          # OCR scanning + medication extraction
├── convex/
│   ├── schema.ts                  # All table definitions
│   ├── auth.ts                    # Better Auth Convex adapter (if used)
│   ├── user.ts
│   ├── pharmacy.ts
│   ├── medication.ts
│   ├── inventory.ts
│   ├── order.ts
│   ├── delivery.ts
│   ├── payment.ts
│   └── prescription.ts
├── CLAUDE.md
├── PLAN.md
└── package.json
```

Each module follows the existing three-file pattern:

| File | Responsibility |
|---|---|
| `index.ts` | Elysia plugin — route definitions, TypeBox validation hooks |
| `model.ts` | TypeBox schemas exported as a `Model` namespace |
| `service.ts` | `abstract class Service` with static methods, delegates to Convex |

---

## 3. Module Breakdown

### 3.1 Auth (`src/modules/auth/`)
Already scaffolded. Just needs to be enabled.

**Responsibilities**
- Email/password sign-up and sign-in
- Session management via Better Auth
- `authGuard` macro available to any route that needs a logged-in user

**Action:** Uncomment the two lines in `src/modules/index.ts` and set `BETTER_AUTH_SECRET`.

---

### 3.2 User (`src/modules/user/`)
Better Auth owns the `users` table. This module owns the extended profile.

**Responsibilities**
- Store display name, saved delivery addresses, default address
- Expose profile read/update endpoints
- Link order history via `orders.userId`

**Endpoints**
```
GET    /v0/user/me               — get my profile
PUT    /v0/user/me               — update profile
GET    /v0/user/me/addresses     — list saved addresses
POST   /v0/user/me/addresses     — add address
DELETE /v0/user/me/addresses/:id — remove address
```

---

### 3.3 Pharmacy (`src/modules/pharmacy/`)

**Responsibilities**
- CRUD for pharmacy records (admin-only mutations, public queries)
- Manage operating hours per day-of-week
- Compute open/closed status at query time

**Endpoints**
```
GET  /v0/pharmacy             — list pharmacies (with open/closed flag)
GET  /v0/pharmacy/:id         — single pharmacy detail
POST /v0/pharmacy             — create (admin)
PUT  /v0/pharmacy/:id         — update (admin)
```

---

### 3.4 Geolocation (`src/modules/geolocation/`)

**Responsibilities**
- Accept user coordinates and return pharmacies sorted by distance
- Filter by `isOpen: true` flag
- Phase 1: Haversine formula computed inside a Convex query
- Phase 2 (future): Delegate to PostGIS for bounding-box + index-optimised queries

**Endpoints**
```
GET /v0/geolocation/nearby?lat=&lng=&radius=&openOnly=
```

---

### 3.5 Medication (`src/modules/medication/`)

**Responsibilities**
- Global catalog of medications (not per-pharmacy)
- Search by name, generic name, or category
- Flag `requiresPrescription`

**Endpoints**
```
GET /v0/medication             — list / search (?q=&category=&page=)
GET /v0/medication/:id         — single medication detail
POST /v0/medication            — create (admin)
PUT  /v0/medication/:id        — update (admin)
```

---

### 3.6 Inventory (`src/modules/inventory/`)

**Responsibilities**
- Per-pharmacy stock: links a pharmacy to a medication with quantity and price
- Real-time availability check before adding to cart

**Endpoints**
```
GET  /v0/inventory?pharmacyId=&medicationId=  — query stock
PUT  /v0/inventory/:id                        — update stock (admin/pharmacy staff)
```

---

### 3.7 Cart (`src/modules/cart/`)

**Responsibilities**
- Persisted cart per user (stored in Convex, not just client-side)
- Validate item availability against inventory before confirming
- Cart is scoped to a single pharmacy (mixed-pharmacy orders not supported in v1)

**Endpoints**
```
GET    /v0/cart                — get current cart
POST   /v0/cart/item           — add item { medicationId, pharmacyId, quantity }
PUT    /v0/cart/item/:id       — update quantity
DELETE /v0/cart/item/:id       — remove item
DELETE /v0/cart                — clear cart
```

---

### 3.8 Order (`src/modules/order/`)

**Responsibilities**
- Convert a cart into a confirmed order
- Order lifecycle: `pending → confirmed → preparing → dispatched → delivered | cancelled`
- Store snapshot of item prices at order time (prevent price-drift issues)
- Attach prescription ID if items require one

**Endpoints**
```
POST /v0/order                 — place order from current cart
GET  /v0/order                 — list my orders
GET  /v0/order/:id             — single order detail + status
PUT  /v0/order/:id/cancel      — cancel (if still pending)
PUT  /v0/order/:id/status      — update status (pharmacy/admin)
```

---

### 3.9 Delivery (`src/modules/delivery/`)

**Responsibilities**
- One delivery record per order
- Track courier assignment, ETA, and live location updates
- Status mirrors order status for simplicity in v1

**Endpoints**
```
GET /v0/delivery/:orderId      — get delivery info for an order
PUT /v0/delivery/:id/location  — update courier location (internal/courier app)
```

---

### 3.10 Payment (`src/modules/payment/`)

**Responsibilities**
- Create a Stripe PaymentIntent when an order is placed
- Webhook handler to update `paymentStatus` on Stripe events
- Refund support for cancellations

**Endpoints**
```
POST /v0/payment/intent        — create PaymentIntent for an order
POST /v0/payment/webhook       — Stripe webhook receiver (raw body)
POST /v0/payment/:orderId/refund — refund (admin)
```

**Key note:** The Stripe webhook route must receive the raw body (not JSON-parsed) for signature verification. Configure this in the Elysia route with `parse: 'text'` and validate `stripe-signature` header manually.

---

### 3.11 Prescription (`src/modules/prescription/`)

**Responsibilities**
- Accept an image upload (base64 or multipart)
- Send image to OCR service (Google Cloud Vision or Tesseract.js for offline fallback)
- Parse returned text: extract medication names + dosages using an LLM prompt or regex heuristics
- Match extracted names against the medications catalog (fuzzy search)
- Return matched + unmatched results so the user can confirm before adding to cart

**Endpoints**
```
POST /v0/prescription/scan     — upload image, returns extracted medications
GET  /v0/prescription/:id      — get a saved prescription scan
GET  /v0/prescription          — list my prescription scans
```

**OCR Decision:** Use Google Cloud Vision API (high accuracy for handwriting). For development/offline, wrap Tesseract.js as a fallback. The service layer abstracts the provider so it can be swapped.

---

## 4. Convex Schema Design

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  // ── User profiles (extends Better Auth's users table) ─────────────────
  userProfiles: defineTable({
    authUserId: v.string(),           // Better Auth user ID (foreign key)
    displayName: v.optional(v.string()),
    phone: v.optional(v.string()),
  }).index("by_authUserId", ["authUserId"]),

  savedAddresses: defineTable({
    userId: v.string(),               // Better Auth user ID
    label: v.string(),                // e.g. "Home", "Office"
    street: v.string(),
    city: v.string(),
    country: v.string(),
    postalCode: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    isDefault: v.boolean(),
  }).index("by_userId", ["userId"]),

  // ── Pharmacies ──────────────────────────────────────────────────────────
  pharmacies: defineTable({
    name: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    lat: v.number(),
    lng: v.number(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    isActive: v.boolean(),
    // Operating hours: array of { day: 0-6, openTime: "HH:MM", closeTime: "HH:MM" }
    operatingHours: v.array(v.object({
      day: v.number(),                // 0 = Sunday … 6 = Saturday
      openTime: v.string(),           // "08:00"
      closeTime: v.string(),          // "22:00"
    })),
  }).index("by_city", ["city"]),

  // ── Medications (global catalog) ────────────────────────────────────────
  medications: defineTable({
    name: v.string(),
    genericName: v.optional(v.string()),
    brand: v.optional(v.string()),
    category: v.string(),             // e.g. "antibiotic", "analgesic"
    description: v.optional(v.string()),
    requiresPrescription: v.boolean(),
    dosageForms: v.array(v.string()), // ["tablet", "syrup"]
  })
    .index("by_name", ["name"])
    .index("by_category", ["category"])
    .searchIndex("search_name", { searchField: "name" }),

  // ── Inventory (per-pharmacy stock) ─────────────────────────────────────
  inventory: defineTable({
    pharmacyId: v.id("pharmacies"),
    medicationId: v.id("medications"),
    quantity: v.number(),
    price: v.number(),                // in smallest currency unit (cents)
    currency: v.string(),             // "USD", "EUR", …
    isAvailable: v.boolean(),
  })
    .index("by_pharmacy", ["pharmacyId"])
    .index("by_medication", ["medicationId"])
    .index("by_pharmacy_medication", ["pharmacyId", "medicationId"]),

  // ── Carts ───────────────────────────────────────────────────────────────
  carts: defineTable({
    userId: v.string(),
    pharmacyId: v.id("pharmacies"),   // cart is locked to one pharmacy
    status: v.union(
      v.literal("active"),
      v.literal("checked_out"),
      v.literal("abandoned"),
    ),
  }).index("by_userId_active", ["userId", "status"]),

  cartItems: defineTable({
    cartId: v.id("carts"),
    medicationId: v.id("medications"),
    inventoryId: v.id("inventory"),
    quantity: v.number(),
  }).index("by_cart", ["cartId"]),

  // ── Orders ──────────────────────────────────────────────────────────────
  orders: defineTable({
    userId: v.string(),
    pharmacyId: v.id("pharmacies"),
    deliveryAddressId: v.id("savedAddresses"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("dispatched"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
    subtotal: v.number(),             // cents
    deliveryFee: v.number(),
    total: v.number(),
    currency: v.string(),
    paymentStatus: v.union(
      v.literal("unpaid"),
      v.literal("paid"),
      v.literal("refunded"),
    ),
    prescriptionId: v.optional(v.id("prescriptions")),
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_pharmacyId", ["pharmacyId"])
    .index("by_status", ["status"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    medicationId: v.id("medications"),
    name: v.string(),                 // snapshot at order time
    quantity: v.number(),
    unitPrice: v.number(),            // snapshot at order time
    totalPrice: v.number(),
  }).index("by_order", ["orderId"]),

  // ── Deliveries ──────────────────────────────────────────────────────────
  deliveries: defineTable({
    orderId: v.id("orders"),
    courierId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("assigned"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("failed"),
    ),
    estimatedDeliveryAt: v.optional(v.number()), // Unix ms
    deliveredAt: v.optional(v.number()),
    courierLat: v.optional(v.number()),
    courierLng: v.optional(v.number()),
    trackingNotes: v.optional(v.string()),
  }).index("by_order", ["orderId"]),

  // ── Payments ─────────────────────────────────────────────────────────────
  payments: defineTable({
    orderId: v.id("orders"),
    userId: v.string(),
    amount: v.number(),               // cents
    currency: v.string(),
    provider: v.literal("stripe"),
    providerPaymentId: v.string(),    // Stripe PaymentIntent ID
    status: v.union(
      v.literal("created"),
      v.literal("processing"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
  })
    .index("by_order", ["orderId"])
    .index("by_providerPaymentId", ["providerPaymentId"]),

  // ── Prescriptions ────────────────────────────────────────────────────────
  prescriptions: defineTable({
    userId: v.string(),
    imageStorageId: v.string(),       // Convex file storage ID
    ocrRawText: v.optional(v.string()),
    extractedItems: v.array(v.object({
      rawText: v.string(),            // what OCR found
      medicationId: v.optional(v.id("medications")), // matched catalog entry
      matchedName: v.optional(v.string()),
      dosage: v.optional(v.string()),
      confidence: v.number(),         // 0.0–1.0
    })),
    status: v.union(
      v.literal("pending"),           // image uploaded, OCR not run yet
      v.literal("processing"),        // OCR in flight
      v.literal("processed"),         // OCR complete, awaiting user review
      v.literal("verified"),          // user confirmed and attached to order
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),
});
```

---

## 5. Phased Implementation Roadmap

### Phase 1 — Foundation (Week 1–2)
**Goal:** Working auth, user profiles, and a seeded pharmacy + medication catalog.

- [ ] Enable Better Auth in `src/modules/index.ts`
- [ ] Set required env vars (`BETTER_AUTH_SECRET`, etc.)
- [ ] Implement `user` module (profile + addresses)
- [ ] Implement `pharmacy` module (CRUD, operating hours, open/closed logic)
- [ ] Implement `medication` module (catalog, search index)
- [ ] Write seed scripts for pharmacies and medications in Convex
- [ ] Update `package.json` version to `1.0.0` to set API prefix to `v1`

**Deliverable:** `POST /v1/auth/sign-up`, `GET /v1/pharmacy`, `GET /v1/medication?q=amoxicillin` all working.

---

### Phase 2 — Geolocation & Inventory (Week 3–4)
**Goal:** Users can find nearby open pharmacies and check what's in stock.

- [ ] Implement `geolocation` module with Haversine distance calculation in a Convex query
- [ ] `GET /v1/geolocation/nearby?lat=&lng=&radius=5&openOnly=true`
- [ ] Implement `inventory` module (per-pharmacy stock levels)
- [ ] Admin endpoint to seed/update inventory
- [ ] Integrate availability check into the medication detail response

**Deliverable:** Given a lat/lng, return sorted list of open pharmacies within N km, each showing available medications.

---

### Phase 3 — Cart & Ordering (Week 5–6)
**Goal:** Users can build a cart and place an order.

- [ ] Implement `cart` module (add/update/remove items, validation against inventory)
- [ ] Implement `order` module (checkout from cart, lifecycle mutations)
- [ ] Inventory decrement on order confirmation (Convex transaction)
- [ ] Inventory restore on cancellation
- [ ] Order status update endpoint for pharmacy staff

**Deliverable:** Full order flow from cart → confirmed order, with inventory correctly adjusted.

---

### Phase 4 — Payment (Week 7)
**Goal:** Orders require payment via Stripe before being confirmed.

- [ ] Add `stripe` dependency
- [ ] Implement `payment` module (create PaymentIntent, webhook handler)
- [ ] Tie order `paymentStatus` to Stripe webhook events
- [ ] Implement refund flow for cancelled orders
- [ ] Protect the webhook route from CSRF (Stripe signature validation)

**Deliverable:** End-to-end payment: place order → Stripe payment → order confirmed.

---

### Phase 5 — Delivery Tracking (Week 8)
**Goal:** Users can track their order after dispatch.

- [ ] Implement `delivery` module
- [ ] Auto-create a `deliveries` record when an order moves to `confirmed`
- [ ] Courier location update endpoint (for a future courier-side app or manual dispatch)
- [ ] Expose delivery status on the order detail response

**Deliverable:** `GET /v1/order/:id` includes live delivery status and ETA.

---

### Phase 6 — OCR / Prescription Scanning (Week 9–10)
**Goal:** Users photograph a prescription; the app extracts and matches medications.

- [ ] Set up Convex file storage for prescription images
- [ ] Implement `prescription` module (upload, OCR pipeline, fuzzy medication matching)
- [ ] Integrate Google Cloud Vision API (handwriting model) in the service layer
- [ ] Implement fuzzy-match against the medications catalog (Convex search index + Levenshtein fallback)
- [ ] Prescription attachment to orders for medications requiring one
- [ ] Tesseract.js fallback for development/offline

**Deliverable:** `POST /v1/prescription/scan` returns a list of matched medications with confidence scores.

---

### Phase 7 — Mobile Frontend (Week 11–14, parallel where possible)
**Goal:** React Native Expo app consuming all the above endpoints.

- [ ] Init Expo app (`apps/mobile/`)
- [ ] Auth screens (sign-up, sign-in)
- [ ] Home screen: nearby pharmacies map (react-native-maps)
- [ ] Pharmacy detail: operating hours, inventory list
- [ ] Search: medication catalog with availability filter
- [ ] Cart + checkout flow
- [ ] Prescription scan screen (Expo Camera + image picker)
- [ ] Order history + live tracking screen
- [ ] Payment sheet (Stripe React Native SDK)

---

## 6. PostGIS Integration (Future)

In Phase 2, nearby-pharmacy queries use the Haversine formula computed inside Convex. This is fine for a few hundred pharmacies.

When the pharmacy count grows or query latency becomes a problem, extract geospatial queries into a dedicated PostGIS service:

**What changes:**
- Add a PostgreSQL + PostGIS database alongside Convex
- Sync pharmacy lat/lng into a `pharmacies` PostGIS table (event-driven from Convex webhooks or a background job)
- The `geolocation` module's service layer calls this PostgreSQL service instead of Convex for the `nearby` query
- The rest of the data model stays in Convex

**Why not now:** PostGIS requires a separate managed Postgres instance, more ops, and a sync layer — overkill for the validation phase.

**Where it plugs in:** `src/modules/geolocation/service.ts` — the method `Service.findNearby()` is the only function that changes. Everything else is untouched.

---

## 7. Key Decisions & Trade-offs

| Decision | Choice | Rationale |
|---|---|---|
| Monolith vs microservices | Monolith (Elysia plugins) | Ship faster, extract later if needed |
| Database | Convex | Already in the template; real-time, serverless, no infra to manage |
| Auth | Better Auth (already scaffolded) | Avoids rebuilding session management |
| Cart persistence | Convex (server-side) | Cart survives app close, can be resumed on another device |
| Price snapshot on order | Yes | Protects against inventory price changes after cart is created |
| Geolocation algorithm | Haversine in Convex | Sufficient for Phase 1; PostGIS path documented above |
| OCR provider | Google Cloud Vision (handwriting) | Best accuracy for doctor handwriting; Tesseract fallback for dev |
| Payment provider | Stripe | Industry standard; good React Native SDK |
| Multi-pharmacy cart | Not supported in v1 | Simplifies logistics; single delivery partner per order |
| Prescription verification | User-confirmed, not pharmacist-verified in v1 | Speeds up MVP; add pharmacist review step in v2 |
| Image storage | Convex file storage | Zero-config, already in the stack |

---

## 8. Environment Variables (Full List)

```env
# Existing
CONVEX_URL=

# Auth (Better Auth)
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
AUTH_DATABASE_URL=./auth.db

# Payment
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# OCR
GOOGLE_CLOUD_VISION_API_KEY=

# Optional overrides
HOST=0.0.0.0
PORT=3000
CORS_ORIGINS=http://localhost:8081
```

---

## 9. API Summary

All routes are prefixed `/v1/` (after bumping `package.json` version to `1.0.0`).

| Method | Path | Auth | Module |
|---|---|---|---|
| POST | `/v1/auth/sign-up/email` | — | auth |
| POST | `/v1/auth/sign-in/email` | — | auth |
| POST | `/v1/auth/sign-out` | yes | auth |
| GET | `/v1/auth/session` | yes | auth |
| GET | `/v1/user/me` | yes | user |
| PUT | `/v1/user/me` | yes | user |
| GET/POST | `/v1/user/me/addresses` | yes | user |
| DELETE | `/v1/user/me/addresses/:id` | yes | user |
| GET | `/v1/pharmacy` | — | pharmacy |
| GET | `/v1/pharmacy/:id` | — | pharmacy |
| POST/PUT | `/v1/pharmacy` | admin | pharmacy |
| GET | `/v1/geolocation/nearby` | — | geolocation |
| GET | `/v1/medication` | — | medication |
| GET | `/v1/medication/:id` | — | medication |
| GET | `/v1/inventory` | — | inventory |
| PUT | `/v1/inventory/:id` | admin | inventory |
| GET/DELETE | `/v1/cart` | yes | cart |
| POST/PUT/DELETE | `/v1/cart/item` | yes | cart |
| GET/POST | `/v1/order` | yes | order |
| GET | `/v1/order/:id` | yes | order |
| PUT | `/v1/order/:id/cancel` | yes | order |
| PUT | `/v1/order/:id/status` | admin | order |
| GET | `/v1/delivery/:orderId` | yes | delivery |
| POST | `/v1/payment/intent` | yes | payment |
| POST | `/v1/payment/webhook` | — | payment |
| POST | `/v1/prescription/scan` | yes | prescription |
| GET | `/v1/prescription` | yes | prescription |
| GET | `/v1/prescription/:id` | yes | prescription |
