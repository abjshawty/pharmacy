# Request Flow Diagram

This diagram describes how an HTTP request moves through the server stack from the client to the database and back.

```text
+--------------------+
|      Client        |
| (HTTP consumer)    |
+---------+----------+
          |
          | 1. HTTP request (e.g. POST /v0/post)
          v
+---------+----------+
|   Elysia Server    |
|  src/index.ts      |
+---------+----------+
          |
          | 2. Route dispatch
          v
+---------+----------+
|  Post Module       |
|  src/modules/post  |
|  - index.ts        |
|  - model.ts        |
+---------+----------+
          |
          | 3. Validation & mapping
          v
+---------+----------+
|  Service Layer     |
|  src/modules/      |
|  post/service.ts   |
+---------+----------+
          |
          | 4. Convex HTTP call
          v
+---------+----------+
| Convex Client      |
| src/client.ts      |
| ConvexHttpClient   |
+---------+----------+
          |
          | 5. RPC (query/mutation)
          v
+---------+----------+
| Convex Functions   |
| convex/post.ts     |
+---------+----------+
          |
          | 6. DB operations
          v
+---------+----------+
|  Convex Database   |
|  (posts table)     |
+--------------------+
```

## Step-by-step

1. **Client** sends an HTTP request (e.g. `POST /v0/post`) to the server.
2. **Elysia server** (`src/index.ts` + `src/modules/index.ts`) receives the request and routes it to the `post` module.
3. **Post module** (`src/modules/post/index.ts`) applies Elysia validation via `Model` and hands the request to the `Service`.
4. **Service layer** (`src/modules/post/service.ts`) performs extra checks and uses the exported `convex` client.
5. **Convex client** (`src/client.ts`) calls the appropriate Convex **query** or **mutation** from `convex/post.ts` via the generated `api`.
6. **Convex functions** (`convex/post.ts`) read/write the **Convex database** according to the schema in `convex/schema.ts`.
7. The result is returned back up the chain (Convex → Service → Post module → Elysia → Client) as an HTTP response.
