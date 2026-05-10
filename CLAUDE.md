# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (requires two terminals)
bun run setup        # Terminal 1: start Convex dev backend
bun run dev:watch    # Terminal 2: hot-reload Elysia server

# Other dev modes
bun run dev          # Watch mode (slightly slower reload)
bun run dev:debug    # Watch mode + Node inspector

# Testing
bun test                           # Run all tests
bun test src/tests/geo.test.ts     # Run a single test file

# Type checking
bun run typecheck

# Data
bun run seed         # Seed Convex with sample pharmacies + medications
bun run studio       # Open Convex dashboard in browser

# Setup
bun run setup:full   # bun install + init auth DB + start Convex dev
```

**Swagger UI** is live at `http://localhost:3000/v1/openapi` when the server is running.

## Architecture

Request path: `HTTP → Elysia router → Module → Service → Convex HTTP client → Convex backend`

Every feature follows a strict **three-file module** pattern under `src/modules/<name>/`:

- **`index.ts`** — Elysia plugin with routes, TypeBox validation, and auth macros
- **`model.ts`** — TypeBox schema namespace (request bodies, query params, response shapes)
- **`service.ts`** — Abstract class with static methods; all DB calls go through here

Modules are mounted in `src/modules/index.ts`. API version is derived from `package.json` major (currently `v1`).

**Current modules:** `auth`, `user`, `pharmacy`, `medication`, `inventory`, `geolocation`, `post` (legacy template)

### Convex integration

`src/client.ts` exports a single `convex` HTTP client. All service methods call it with type-safe RPC:

```typescript
import { convex } from "@/src/client";
import { api } from "@/convex/_generated/api";

static async list(query: Model.listQuery) {
    return await convex.query(api.pharmacy.list, { city: query.city });
}
```

`convex/_generated/` is auto-generated — never edit it. The source of truth is `convex/schema.ts` (defines all tables + indexes) and `convex/<module>.ts` (query/mutation implementations).

### Auth guard

Routes opt into auth with the `auth: true` macro. Add `authGuard` to any module:

```typescript
import { authGuard } from "@modules/auth";

export const myModule = new Elysia({ prefix: "/thing" })
    .use(authGuard)
    .get("/", () => Service.list())                          // public
    .post("/", ({ body }) => Service.create(body), {
        auth: true,   // returns 401 if no valid session
        body: Model.createBody,
    });
```

The `user` and `session` objects are automatically derived from request headers and available in route handlers when `auth: true` is set.

**Auth endpoints** (managed entirely by Better Auth, not hand-written):
- `POST /v1/auth/sign-up/email`
- `POST /v1/auth/sign-in/email`
- `POST /v1/auth/sign-out`
- `GET  /v1/auth/session`

Auth storage is a SQLite file (`auth.db`, git-ignored). Configure OAuth, 2FA, etc. in `src/modules/auth/auth.ts`.

### Geolocation utilities

`convex/lib/geo.ts` exports two testable pure functions used by the pharmacy service:
- `haversineKm(lat1, lon1, lat2, lon2)` — distance in km between two coordinates
- `isOpenNow(hours)` — whether a pharmacy is open at current time

## Environment

Copy `.env.example` to `.env`. Required:

```env
CONVEX_URL=https://<deployment>.convex.cloud   # from `bun run setup`
BETTER_AUTH_SECRET=<random-string>
```

Optional overrides: `HOST`, `PORT`, `CORS_ORIGINS`, `BETTER_AUTH_URL`, `AUTH_DATABASE_URL`

Later phases add: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_CLOUD_VISION_API_KEY`

## Adding a New Module

1. Create `src/modules/<name>/` with `index.ts`, `model.ts`, `service.ts` following the three-file pattern
2. Add the corresponding Convex functions in `convex/<name>.ts`
3. Update `convex/schema.ts` if new tables are needed (add indexes for any field used in `.filter()` or `.withIndex()`)
4. Mount the plugin in `src/modules/index.ts`

## Path Aliases

- `@/*` → project root
- `@modules/*` → `src/modules/`
