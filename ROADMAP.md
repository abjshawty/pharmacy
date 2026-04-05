# Roadmap

This roadmap describes how the server template will evolve into a plugin-driven backend where users can start from a clean core and add capabilities via simple commands.

The guiding principles are:

- Keep the **core server minimal** (Elysia + Convex + basic health/info endpoints).
- Ship **first-class plugins** for common concerns (auth, payments, logging, analytics, etc.).
- Allow users to **swap implementations** (e.g. Pino instead of Bun Logger, Redis alternatives, different analytics providers).
- Prefer **configuration over forking**: plugins should be attachable/detachable in code with minimal changes.

---

## 1. Core server baseline

**Goal:** A working backend server with no external plugins enabled by default.

- Elysia HTTP server with versioned routes and OpenAPI.
- Convex integration for persistence.
- Basic health checks (`/health`, `/ready`) and simple example routes (e.g. posts).
- Minimal configuration file (e.g. `server.config.ts` or `plugins.config.ts`) describing which plugins are enabled.

**Strategy:**

- Introduce a `createServer` factory (e.g. `src/server.ts`) that:
  - Instantiates Elysia.
  - Mounts core routes.
  - Reads a plugin registry and conditionally `.use()` plugins.
- Export a typed `PluginDefinition` interface describing:
  - `id`, `description`.
  - `envVars` required.
  - `register(app: Elysia, options?: unknown): Elysia`.
- Keep the `src/index.ts` entrypoint focused on calling `createServer()` and `listen()`.

---

## 2. Plugin system & CLI integration

**Goal:** Allow users to enable/disable plugins via simple commands and/or config, without manual wiring everywhere.

**Planned work:**

- Define a `plugins/` directory with one module per plugin (e.g. `plugins/auth`, `plugins/logging`, etc.).
- Add a `plugins.config.ts` (or JSON/YAML) that lists enabled plugins and provider choices.
- Provide a small CLI (e.g. `bun run plugin add logging --provider=bun-logger`) that:
  - Updates `plugins.config.ts`.
  - Optionally scaffolds example config files or environment variable stubs.

**Strategy:**

- Implement a plugin loader that:
  - Reads `plugins.config.ts`.
  - Dynamically imports the selected plugins.
  - Calls each plugin's `register` function on the Elysia app.
- Design plugin options to be **provider-agnostic**, for example:

  - Logging plugin options might accept `{ provider: 'bun-logger' | 'pino' | 'custom', level: 'info' | 'debug' | ... }`.
  - Analytics plugin options might accept `{ provider: 'axiom' | 'posthog' | 'custom', apiKeyEnvVar: string }`.

This way, the same logical plugin can support multiple concrete integrations.

---

## 3. Auth plugin

**Goal:** Pluggable authentication based on **Better-Auth** by default, but open to alternatives.

**Scope:**

- Session-based or token-based auth middleware for Elysia.
- User model stored in Convex (or external identity provider if configured).
- Common flows: sign-up, login, logout, password reset, social login (later).

**Strategy:**

- Implement `plugins/auth/better-auth.ts` that:
  - Wires Better-Auth middleware into Elysia.
  - Exposes standard endpoints under `/auth/*`.
  - Documents required env vars (secrets, provider keys, etc.).
- Allow alternative auth implementations by:
  - Keeping interfaces like `AuthContext` or `CurrentUser` abstract.
  - Documenting how to plug in a custom auth plugin instead of the default one.

---

## 4. Payment plugin

**Goal:** Payment integration with **Stripe** (and optionally Better-Auth integration), while allowing other providers.

**Scope:**

- Basic Stripe checkout/session endpoints.
- Webhook handler route.
- Helpers for attaching Stripe customers to authenticated users.

**Strategy:**

- Implement `plugins/payment/stripe.ts`:
  - Expose Elysia routes for creating checkout sessions, managing subscriptions.
  - Use Convex to store subscription and invoice metadata.
  - Provide a small set of helpers for common SaaS patterns.
- Design plugin options to allow swapping to another payment provider by implementing the same interface.

---

## 5. Queue plugin

**Goal:** Background processing using **Kafka** by default, with room for alternatives.

**Scope:**

- Produce/consume jobs from topics.
- Integration with Convex where appropriate for job metadata.

**Strategy:**

- Implement `plugins/queue/kafka.ts` that:
  - Creates a Kafka client.
  - Exposes helpers for scheduling and consuming jobs.
  - Provides middleware/hooks so route handlers can easily enqueue work.
- Keep interfaces minimal so an alternative queue backend (e.g. Redis streams, Convex scheduler, cloud queues) can be plugged in.

---

## 6. Storage plugin

**Goal:** File storage via **S3-compatible buckets** by default, while supporting alternatives like volume storage.

**Scope:**

- Signed upload URLs.
- Simple download endpoints.
- Metadata storage in Convex.

**Strategy:**

- Implement `plugins/storage/s3.ts` for bucket-based storage.
- Define a `StorageProvider` interface used by the plugin, so alternatives (e.g. local volume storage, other cloud providers) can implement the same interface.
- Provide an opinionated but replaceable folder structure and naming scheme.

---

## 7. Cache plugin

**Goal:** Caching via **Redis** by default, with support for other caches (e.g. Neocache or in-memory stores).

**Scope:**

- Simple `get/set` helpers with TTL.
- Request-level caching for expensive queries.

**Strategy:**

- Implement `plugins/cache/redis.ts` that:
  - Creates a Redis client.
  - Exposes a small caching API to route handlers and services.
- Abstract cache access behind a `Cache` interface, so users can:
  - Use Redis, Neocache, or in-memory adapters.
  - Disable caching entirely in development.

---

## 8. Notifications plugin

**Goal:** Email + SMS notifications via **Resend/NodeMailer** and **Twilio**, with room for alternatives.

**Scope:**

- Email sending for account events (verification, password reset, receipts).
- SMS for MFA or alerts.

**Strategy:**

- Implement `plugins/notifications/email.ts` and `plugins/notifications/sms.ts` with provider-specific options.
- Provide an abstract `NotificationService` with methods like `sendEmail`, `sendSms` so apps are not tied to specific providers.

---

## 9. Analytics plugin (Axiom-first)

**Goal:** Centralized analytics and events collection using **Axiom** as the primary provider, while making it easy to use PostHog or others.

**Scope:**

- Server-side event capture (requests, domain events, errors).
- Optional client-side integration documented for frontends.

**Strategy:**

- Implement `plugins/analytics/axiom.ts` that:
  - Batches and sends events to Axiom.
  - Hooks into Elysia lifecycle for basic request logging and metrics.
- Provide a generic `track(eventName, properties)` API that can be backed by:
  - Axiom (default),
  - PostHog,
  - or a custom implementation.
- Consider supporting multiple providers simultaneously by broadcasting events to all configured backends.

---

## 10. Security plugin

**Goal:** Common security hardening features that can be enabled as a group.

**Scope:**

- Rate limiting.
- IP blocking / allowlists.
- API key management (per-client keys with scopes).

**Strategy:**

- Implement a `plugins/security` module that:
  - Provides Elysia middleware for rate limiting and IP checks.
  - Exposes helpers and Convex-backed models for API keys.
- Ensure compatibility with auth and analytics plugins (e.g. tag events with API key IDs).

---

## 11. Logging plugin

**Goal:** Structured logging with **Bun Logger** by default, but compatible with alternatives like **Pino**.

**Scope:**

- Request/response logs.
- Application-level logs with contexts (user, request id, correlation id).

**Strategy:**

- Implement `plugins/logging/bun-logger.ts` that:
  - Wraps Bun's logger and integrates with Elysia.
  - Optionally emits logs to stdout and/or external sinks.
- Support alternative providers by standardizing on a `Logger` interface and allowing selection via `plugins.config.ts`.

---

## 12. Monitoring plugin

**Goal:** Error and performance monitoring with **Sentry** by default.

**Scope:**

- Automatic error reporting.
- Basic performance traces for key routes.

**Strategy:**

- Implement `plugins/monitoring/sentry.ts` that:
  - Initializes Sentry.
  - Wraps Elysia handlers to capture exceptions and traces.
- Document how to replace Sentry with another monitoring system by implementing the same hooks.

---

## 13. Additional future plugins

Beyond the currently planned plugins, additional integrations can be added over time:

- **Feature flags**: LaunchDarkly, Unleash, or custom Convex-backed flags.
- **Search**: Algolia, Meilisearch, or OpenSearch integration.
- **Webhooks**: Unified outbound webhooks management with retries and signing.
- **GraphQL layer**: Optional GraphQL server (via Elysia plugins) on top of Convex.

Each additional plugin should follow the same design:

- Isolated implementation under `plugins/`.
- Provider-agnostic interface with type-safe options.
- Simple enabling/disabling via config and CLI.

---

## 14. Developer experience

To make this template approachable and extensible:

- Provide **copy-pastable examples** for enabling each plugin.
- Maintain **`.env.example`** with all relevant env vars grouped by plugin.
- Add **documentation sections** per plugin in the main README (or `docs/`).
- Consider generating API docs and plugin docs automatically from metadata.

The long-term vision is that a user can:

1. Clone the template and configure Convex.
2. Run `bun install && bun start` to get a working, minimal backend.
3. Enable plugins incrementally using commands like `bun run plugin add analytics --provider=axiom`.
4. Replace or extend plugins with their own implementations as their needs evolve.
