# Changelog

All notable changes to Remote Pharmacy are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.1.0] — 2026-04-08 — Phase 1 Complete

### Added
- **Auth** — Better Auth enabled; email/password sign-up, sign-in, sign-out, session (`/v1/auth/*`)
- **User module** — profile read/update, saved addresses CRUD (`/v1/user/me`)
- **Pharmacy module** — CRUD with operating hours; real-time `isOpen` flag computed per request (`/v1/pharmacy`)
- **Medication module** — global catalog with full-text search index and category filter (`/v1/medication`)
- **Convex schema** — full domain schema: all 12 tables defined with indexes and search indexes
- **Convex functions** — `user.ts`, `pharmacy.ts`, `medication.ts` (queries + mutations)
- **Seed script** — `convex/seed.ts`; idempotent seed with 5 pharmacies and 24 medications across 9 categories; run with `bun run seed`
- **`.env.example`** — documented all required environment variables for current and future phases

### Changed
- API prefix updated to `/v1/` (package version `1.0.0` → `1.1.0`)
- Auth `basePath` updated to `/v1/auth`
- `GET /` now redirects to `/v1/openapi` (versioned path)
- Startup `console.log` added to `src/index.ts`

---

## [1.0.0] — 2026-04-08 — Project Initialisation

### Added
- `PLAN.md` — full development plan: module breakdown, Convex schema design, 8-phase roadmap, PostGIS migration path, key trade-offs
- `README.md` — rewritten for Remote Pharmacy (feature overview, tech stack, getting started guide, API summary)

### Changed
- Forked from generic Bun + Elysia + Convex backend template
- Repurposed as Remote Pharmacy backend monolith

---

## Upcoming

### [1.2.0] — Phase 2: Geolocation & Inventory
- `geolocation` module — nearby pharmacy search via Haversine formula
- `inventory` module — per-pharmacy stock levels, availability check
- `GET /v1/geolocation/nearby?lat=&lng=&radius=&openOnly=`
- `GET /v1/inventory?pharmacyId=&medicationId=`

### [1.3.0] — Phase 3: Cart & Ordering
- `cart` module — persistent per-user cart locked to a single pharmacy
- `order` module — order placement, lifecycle management, inventory decrement

### [1.4.0] — Phase 4: Payments
- `payment` module — Stripe PaymentIntent, webhook handler, refunds

### [1.5.0] — Phase 5: Delivery Tracking
- `delivery` module — courier assignment, live location updates, ETA

### [1.6.0] — Phase 6: OCR & Prescription Scanning
- `prescription` module — Google Cloud Vision OCR, fuzzy medication matching

### [1.7.0] — Phase 7: Mobile Frontend
- React Native (Expo) app — all screens, Stripe SDK, react-native-maps
