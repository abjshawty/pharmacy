# Test Plan

## Unit tests (`bun test`)

Unit tests live in `src/tests/` and run with `bun test`. They cover pure
functions that can be exercised without a running server or Convex backend.

### `geo.test.ts` — `haversineKm` and `isOpenNow` ✅

| # | Test | Status |
|---|---|---|
| 1 | `haversineKm` returns 0 for identical coordinates | ✅ |
| 2 | `haversineKm` is approximately correct for a known distance (Nairobi CBD → JKIA ~15 km) | ✅ |
| 3 | `haversineKm` is symmetric (Paris→London = London→Paris) | ✅ |
| 4 | `haversineKm` crosses the equator correctly (~111 km per degree) | ✅ |
| 5 | `haversineKm` crosses the prime meridian correctly (~111 km per degree) | ✅ |
| 6 | `haversineKm` handles antipodal points (~20,000 km) | ✅ |
| 7 | `isOpenNow` returns `true` when time is within operating hours | ✅ |
| 8 | `isOpenNow` returns `false` when time is before opening | ✅ |
| 9 | `isOpenNow` returns `false` when time is after closing | ✅ |
| 10 | `isOpenNow` returns `false` when no slot defined for the current day | ✅ |
| 11 | `isOpenNow` returns `false` for empty operating hours | ✅ |
| 12 | `isOpenNow` returns `true` exactly at opening time (boundary inclusive) | ✅ |
| 13 | `isOpenNow` returns `true` exactly at closing time (boundary inclusive) | ✅ |
| 14 | `isOpenNow` returns `true` when matching one of multiple day slots | ✅ |
| 15 | `isOpenNow` uses wall-clock time when no `now` argument is passed | ✅ |

---

## Integration tests (not yet implemented)

Integration tests require a running server (`bun run dev`) and a seeded
Convex backend. They should be implemented as a separate test suite, ideally
using `bun test` with a dedicated setup/teardown that seeds and cleans up
Convex data.

---

### Phase 1 — Auth

| # | Method + Path | Scenario | Expected |
|---|---|---|---|
| 1 | `POST /v1/auth/sign-up/email` | Valid email + password | 200, user created |
| 2 | `POST /v1/auth/sign-up/email` | Duplicate email | 422 `USER_ALREADY_EXISTS` |
| 3 | `POST /v1/auth/sign-up/email` | Missing password | 422 validation error |
| 4 | `POST /v1/auth/sign-in/email` | Correct credentials | 200, `set-cookie` header present |
| 5 | `POST /v1/auth/sign-in/email` | Wrong password | 401 `INVALID_EMAIL_OR_PASSWORD` |
| 6 | `POST /v1/auth/sign-in/email` | Non-existent email | 401 |
| 7 | `GET /v1/auth/get-session` | With valid session cookie | 200, session + user returned |
| 8 | `GET /v1/auth/get-session` | Without cookie | 200, `null` session |
| 9 | `POST /v1/auth/sign-out` | With valid session cookie | 200, cookies cleared |

### Phase 1 — User

| # | Method + Path | Scenario | Expected |
|---|---|---|---|
| 10 | `GET /v1/user/me` | Authenticated | 200, profile (or `null` if not created yet) |
| 11 | `GET /v1/user/me` | Unauthenticated | 401 |
| 12 | `PUT /v1/user/me` | Update `displayName` | 200, subsequent GET reflects change |
| 13 | `GET /v1/user/me/addresses` | Authenticated, no addresses | 200, `[]` |
| 14 | `POST /v1/user/me/addresses` | Valid address body | 200, address ID returned |
| 15 | `GET /v1/user/me/addresses` | After adding address | 200, address present in list |
| 16 | `DELETE /v1/user/me/addresses/:id` | Own address | 200, removed from list |
| 17 | `DELETE /v1/user/me/addresses/:id` | Another user's address | 404 or 403 |
| 18 | `POST /v1/user/me/addresses` | Unauthenticated | 401 |

### Phase 1 — Pharmacy

| # | Method + Path | Scenario | Expected |
|---|---|---|---|
| 19 | `GET /v1/pharmacy` | No filters | 200, array of active pharmacies |
| 20 | `GET /v1/pharmacy` | `?city=Nairobi` | 200, only Nairobi pharmacies |
| 21 | `GET /v1/pharmacy` | `?openOnly=true` | 200, only currently open pharmacies |
| 22 | `GET /v1/pharmacy/:id` | Valid ID | 200, single pharmacy with `isOpen` field |
| 23 | `GET /v1/pharmacy/:id` | Non-existent ID | 200, `null` |
| 24 | `POST /v1/pharmacy` | Authenticated, valid body | 200, Convex ID returned |
| 25 | `POST /v1/pharmacy` | Unauthenticated | 401 |
| 26 | `POST /v1/pharmacy` | Missing required field (`country`) | 422 validation error |
| 27 | `PUT /v1/pharmacy/:id` | Update `phone` | 200, GET reflects change |
| 28 | `PUT /v1/pharmacy/:id` | Unauthenticated | 401 |

### Phase 1 — Medication

| # | Method + Path | Scenario | Expected |
|---|---|---|---|
| 29 | `GET /v1/medication` | No filters | 200, array |
| 30 | `GET /v1/medication` | `?q=para` | 200, full-text search results |
| 31 | `GET /v1/medication` | `?category=analgesic` | 200, filtered by category |
| 32 | `GET /v1/medication` | `?q=nomatch_xyz` | 200, `[]` |
| 33 | `GET /v1/medication/:id` | Valid ID | 200, single medication |
| 34 | `GET /v1/medication/:id` | Non-existent ID | 200, `null` |
| 35 | `POST /v1/medication` | Authenticated, valid body | 200, Convex ID returned |
| 36 | `POST /v1/medication` | Missing `dosageForms` array | 422 validation error |
| 37 | `POST /v1/medication` | Unauthenticated | 401 |
| 38 | `PUT /v1/medication/:id` | Update `description` | 200, GET reflects change |

---

### Phase 2 — Geolocation

| # | Method + Path | Scenario | Expected |
|---|---|---|---|
| 39 | `GET /v1/geolocation/nearby` | Pharmacy within default 10 km radius | 200, returned with `distanceKm` and `isOpen` |
| 40 | `GET /v1/geolocation/nearby` | Pharmacy outside radius | Not included in results |
| 41 | `GET /v1/geolocation/nearby` | Multiple pharmacies — sorted by distance | Results ordered nearest-first |
| 42 | `GET /v1/geolocation/nearby` | `?openOnly=true`, closed pharmacy in radius | Closed pharmacy excluded |
| 43 | `GET /v1/geolocation/nearby` | `?openOnly=true`, open pharmacy in radius | Open pharmacy included |
| 44 | `GET /v1/geolocation/nearby` | `?radiusKm=0` | `[]` |
| 45 | `GET /v1/geolocation/nearby` | Inactive pharmacy within radius | Not included (`isActive: false`) |
| 46 | `GET /v1/geolocation/nearby` | Missing `lat` | 422 validation error |
| 47 | `GET /v1/geolocation/nearby` | Missing `lng` | 422 validation error |
| 48 | `GET /v1/geolocation/nearby` | Non-numeric `lat` | 422 validation error |

### Phase 2 — Inventory

| # | Method + Path | Scenario | Expected |
|---|---|---|---|
| 49 | `GET /v1/inventory` | No filters | 200, all records |
| 50 | `GET /v1/inventory` | `?pharmacyId=X` | 200, only that pharmacy's stock |
| 51 | `GET /v1/inventory` | `?medicationId=X` | 200, medication across all pharmacies |
| 52 | `GET /v1/inventory` | `?pharmacyId=X&medicationId=Y` | 200, single matching record or `[]` |
| 53 | `GET /v1/inventory/:id` | Valid ID | 200, single inventory record |
| 54 | `GET /v1/inventory/:id` | Non-existent ID | 200, `null` |
| 55 | `POST /v1/inventory` | New `pharmacyId + medicationId` pair | 200, new ID returned |
| 56 | `POST /v1/inventory` | Same pair upserted twice | 200, GET returns one record (no duplicate) |
| 57 | `POST /v1/inventory` | Unauthenticated | 401 |
| 58 | `POST /v1/inventory` | `quantity: -1` | 422 validation error |
| 59 | `POST /v1/inventory` | `price: -1` | 422 validation error |
| 60 | `PUT /v1/inventory/:id` | Update `quantity` and `isAvailable` | 200, GET reflects changes |
| 61 | `PUT /v1/inventory/:id` | Non-existent ID | 500 "Inventory item not found" |
| 62 | `PUT /v1/inventory/:id` | Unauthenticated | 401 |
