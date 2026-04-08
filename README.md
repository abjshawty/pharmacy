# Remote Pharmacy

A mobile utility app that helps users find nearby open pharmacies, check medication availability, order medications for home delivery, and scan prescriptions using OCR.

Built on a modular TypeScript backend with **Bun**, **Elysia**, and **Convex**, paired with a **React Native (Expo)** mobile frontend.

## Features

- **Nearby pharmacy search** — find open pharmacies based on your location
- **Medication inventory** — check what's in stock and where
- **Order & delivery** — place orders and track them in real time
- **Prescription scanning** — photograph a prescription and let OCR extract medication names automatically
- **Payments** — secure checkout via Stripe

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun (>= 1.3.6) |
| API Framework | Elysia (TypeScript, TypeBox, OpenAPI) |
| Database | Convex (serverless, real-time) |
| Auth | Better Auth |
| Payments | Stripe |
| OCR | Google Cloud Vision (Tesseract.js fallback) |
| Mobile | React Native (Expo) |

## Project Structure

```
src/
  index.ts              # Entry point — starts server on port 3000
  client.ts             # Convex HTTP client
  modules/
    index.ts            # Mounts all plugins, API versioning (v1)
    auth/               # Better Auth — sign-up, sign-in, session
    user/               # User profiles and saved addresses
    pharmacy/           # Pharmacy listings and operating hours
    geolocation/        # Nearby pharmacy search (Haversine)
    medication/         # Global medications catalog
    inventory/          # Per-pharmacy stock levels
    cart/               # Persistent user cart
    order/              # Order placement and lifecycle
    delivery/           # Delivery tracking
    payment/            # Stripe PaymentIntent + webhooks
    prescription/       # OCR scanning and medication matching
convex/
  schema.ts             # All table definitions
  *.ts                  # Queries and mutations per module
apps/
  mobile/               # React Native (Expo) — Phase 7
```

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Copy the environment file and fill in the required values:
   ```bash
   cp .env.example .env
   ```

3. Start Convex and the dev server:
   ```bash
   bun run setup:full
   ```

4. In a separate terminal, start the API server:
   ```bash
   bun run dev
   ```

The server starts on `http://localhost:3000`. Swagger UI is available at `http://localhost:3000/v1/openapi`.

## Environment Variables

```env
# Required
CONVEX_URL=

# Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
AUTH_DATABASE_URL=./auth.db

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# OCR
GOOGLE_CLOUD_VISION_API_KEY=

# Optional
HOST=0.0.0.0
PORT=3000
CORS_ORIGINS=http://localhost:8081
```

## API

Base URL: `http://localhost:3000/v1/`

| Method | Path | Auth |
|---|---|---|
| POST | `/v1/auth/sign-up/email` | — |
| POST | `/v1/auth/sign-in/email` | — |
| GET | `/v1/pharmacy` | — |
| GET | `/v1/geolocation/nearby?lat=&lng=&radius=` | — |
| GET | `/v1/medication?q=` | — |
| GET/POST | `/v1/cart/item` | yes |
| GET/POST | `/v1/order` | yes |
| GET | `/v1/delivery/:orderId` | yes |
| POST | `/v1/payment/intent` | yes |
| POST | `/v1/prescription/scan` | yes |

See [PLAN.md](./PLAN.md) for the full API surface, schema design, and implementation roadmap.

## Scripts

```bash
bun run dev           # Watch mode
bun run dev:watch     # Hot reload
bun run start         # Production
bun run setup         # Init Convex dev environment
bun run setup:full    # bun install + setup
```
