# CLAUDE.md

## Project Overview

A modular backend server template built with **Bun**, **Elysia**, and **Convex**. Designed as a fast, typesafe, and extensible API foundation.

## Tech Stack

- **Runtime**: Bun (>= 1.3.6)
- **Framework**: Elysia (TypeScript, TypeBox validation, OpenAPI plugin)
- **Database**: Convex (serverless, cloud-managed)
- **Language**: TypeScript (strict mode, ESNext)

## Project Structure

```
src/
  index.ts           # Entry point — starts server on port 3000
  client.ts          # Convex HTTP client (requires CONVEX_URL env var)
  modules/
    index.ts         # Server init, mounts modules, API versioning (v0)
    post/
      index.ts       # Route definitions for Post CRUD
      model.ts       # TypeBox schemas (request/response validation)
      service.ts     # Business logic, delegates to Convex
convex/
  schema.ts          # Database schema (posts table)
  post.ts            # Convex queries and mutations
  _generated/        # Auto-generated, git-ignored
```

## Key Conventions

- **API versioning**: prefix derived from `package.json` version (currently `v0`)
- **Module pattern**: each feature is an Elysia plugin mounted in `src/modules/index.ts`
- **Service layer**: abstract class with static methods in `service.ts`
- **Validation**: all request/response shapes defined in `model.ts` using TypeBox
- **Path aliases**: `@/*` → project root, `@modules/*` → `src/modules/`

## API Endpoints

Base URL: `http://localhost:3000/v0/`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Redirects to `/openapi` (Swagger UI) |
| POST | `/v0/post` | Create post |
| GET | `/v0/post` | List posts (max 10) |
| GET | `/v0/post/:id` | Get single post |
| PUT | `/v0/post/:id` | Update post |
| DELETE | `/v0/post/:id` | Delete post |

## Environment

Copy `.env.example` to `.env`. Required variables:
- `CONVEX_URL` — Convex deployment URL (obtained after `bun run setup`)
- `HOST`, `PORT`, `CORS_ORIGINS` — optional overrides

## Scripts

```bash
bun run dev          # Watch mode
bun run dev:watch    # Hot reload
bun run dev:debug    # With inspector
bun run start        # Production
bun run setup        # Init Convex dev environment
bun run setup:full   # bun install + setup
```

## Auth Module (optional)

Built with [Better Auth](https://better-auth.com). Disabled by default — opt-in by uncommenting two lines.

**Enable auth:**
1. Uncomment two lines in `src/modules/index.ts` (the import and the `.use(authPlugin)`)
2. Set env vars: `BETTER_AUTH_SECRET` (required), `BETTER_AUTH_URL`, `AUTH_DATABASE_URL`

**Auth endpoints** (all at `/v0/auth/*`, managed by Better Auth):
- `POST /v0/auth/sign-up/email`
- `POST /v0/auth/sign-in/email`
- `POST /v0/auth/sign-out`
- `GET  /v0/auth/session`

**Protecting routes** — import `authGuard` into any module and use the `auth: true` macro:
```typescript
import { authGuard } from "@modules/auth";

export const myModule = new Elysia()
    .use(authGuard)
    .get("/profile", ({ user }) => user, { auth: true });
```

**Storage**: SQLite file (`auth.db` by default, git-ignored). Set `AUTH_DATABASE_URL` to change path.

**Extending**: configure OAuth providers, 2FA, magic links, etc. in `src/modules/auth/auth.ts`.

## Adding a New Module

1. Create `src/modules/<name>/` with `index.ts`, `model.ts`, `service.ts`
2. Register the module in `src/modules/index.ts`
3. Add corresponding Convex functions in `convex/<name>.ts`
4. Update `convex/schema.ts` if new tables are needed

## Planned Plugins

Auth (Better-Auth), Payment (Stripe), Queue (Kafka), Storage (S3), Cache (Redis), Notifications (Resend/Twilio), Analytics (PostHog), Security, Logging, Monitoring (Sentry)
