# Pharmacy Finder — POC Implementation Plan

A lightweight mobile app to browse nearby pharmacies and on-duty
(*pharmacie de garde*) pharmacies in Abidjan. Pharmacy data will be
populated later via scraping; the POC runs on seeded mock data.

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript |
| App framework | React Native via Expo (Bun-managed) |
| Package manager / scripts | Bun |
| Backend + database | Convex |
| Map | MapLibre (`@maplibre/maplibre-react-native`) |
| Location | `expo-location` |
| Auth | None (anonymous) for the POC |

## Key constraints & decisions

- **MapLibre is a native module.** `@maplibre/maplibre-react-native`
  (currently v10.x, the standalone fork of rnmapbox) ships an Expo config
  plugin, but it is **not part of the Expo SDK**. After adding the plugin to
  `app.json` you must rebuild with custom native code. This means a **dev
  build via `expo-dev-client`** (or EAS Build) — it will **not** run in plain
  Expo Go. "Bun + Expo" therefore means a prebuilt Expo dev client, tested on
  a real device or emulator from early on.
- **MapLibre needs a tile/style source** or it renders nothing. We are using
  **OpenFreeMap** (`https://tiles.openfreemap.org/styles/liberty`) — fully
  free, no API key, no request cap. MapTiler was considered but rejected to
  avoid key management and usage caps.
- **Timezone is a non-issue.** Abidjan is GMT (UTC+0) with no DST, so duty
  windows are plain millisecond-epoch comparisons — no timezone math.
- **Duty rotation:** weekly, handover **Saturday 08:00**. A duty week runs
  Saturday 08:00 → the following Saturday 08:00 (GMT).
- **Scope:** Abidjan only for now; multi-city is a later concern.
- **Nearby has loading priority:** load the nearest pharmacies first, then
  fill in the rest as the user pans/zooms the map.

---

## Phase 0 — Scaffold & native baseline

**Decisions locked:**
- Platform: **Android only**
- Build: **local** (Android Studio + SDK + JDK — no EAS)
- Tile source: **OpenFreeMap** (`https://tiles.openfreemap.org/styles/liberty`)
- Navigation: **Expo Router** (file-based)

Create a Bun-managed Expo (TypeScript) project and add:

- `expo-dev-client`
- `@maplibre/maplibre-react-native` + its config plugin (in `app.json`)
- `expo-location`
- `react-native-reanimated` + config plugin (peer dep for gorhom bottom sheet)
- `react-native-gesture-handler` (peer dep for gorhom bottom sheet)
- `@gorhom/bottom-sheet` (pharmacy callout on map marker tap)
- Convex (initialized)

Produce a dev build immediately and confirm a **bare map renders** against
OpenFreeMap on a device/emulator. This is the riskiest integration, so
de-risk it before any data work.

Set up basic navigation with Expo Router:

```
app/
  (tabs)/
    map.tsx          ← Map tab
    on-duty.tsx      ← On-duty tab
  pharmacy/
    [id].tsx         ← Detail screen (root-level, reachable from both tabs)
  _layout.tsx
```

## Phase 1 — Convex data model

Two tables. Free-text fields where the eventual scrape shape is still unknown,
a `sourceId` so the scraper can upsert idempotently, and a `commune` field
since Abidjan's communes (Cocody, Plateau, Yopougon…) are a natural secondary
filter.

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pharmacies: defineTable({
    name: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    phone: v.optional(v.string()),
    hours: v.optional(v.string()),    // free text for now; structure post-scrape
    commune: v.optional(v.string()),
    sourceId: v.optional(v.string()), // stable key for scraper upserts
  }).index("by_lat", ["lat"]),

  dutyShifts: defineTable({
    pharmacyId: v.id("pharmacies"),
    startsAt: v.number(),          // ms epoch — Saturday 08:00 handover
    endsAt: v.number(),            // ms epoch — following Saturday 08:00
    contactName: v.optional(v.string()), // duty pharmacist name; sparse — only some sources provide it
  })
    .index("by_window", ["startsAt", "endsAt"])
    .index("by_pharmacy", ["pharmacyId"]),
});
```

Seed with real Abidjan pharmacy coordinates (geocoded via Nominatim from
scraped name+district data — no API key needed). Duty shifts: one per commune
per seed week, covering at minimum the current week so the on-duty tab has
live data on first launch.

## Phase 2 — Queries (nearby-first by design)

Three query signatures map onto the loading-priority requirement:

- `nearestPharmacies({ lat, lng, limit })` — the **priority load**. Limit is
  **20**. For a single-city dataset this is small enough to collect candidates
  and sort by haversine in the query, returning the top N. No geo index needed.
- `pharmaciesInBounds({ minLat, maxLat, minLng, maxLng, limit })` — the
  **progressive fill** as the user pans/zooms. Debounce the map's
  region-change event (300ms) and refetch for the new viewport.
- `onDutyNow()` — computes the current Saturday-08:00 → next-Saturday-08:00
  window, hits the `by_window` index, and joins to pharmacies.

Because Convex queries are reactive, once the scraper lands and writes new
rows, every open map/list updates live with no extra wiring.

For scale beyond Abidjan, swap the haversine sort for the
`@convex-dev/geospatial` component — a post-POC concern.

## Phase 3 — Map & location

- Request foreground location via `expo-location`.
- Center the map on the user at zoom **14**, fire `nearestPharmacies({ limit: 20 })`
  for the priority render.
- Wire region-change → debounced (300ms) `pharmaciesInBounds` for the rest.
- Pharmacy marker tap → **gorhom bottom sheet callout** (name, commune,
  distance, "View details" button). Tapping the map dismisses it.
- "View details" pushes to `app/pharmacy/[id].tsx` (root-level stack screen).
- On permission-denied, fall back to Abidjan center (`5.3599, -4.0083`) so
  the map is never blank.

## Phase 4 — On-duty view & polish

- On-duty tab consumes `onDutyNow()` as a **list only** (no map overlay),
  sorted by distance when location is available.
- Each row: name, commune, distance, phone number.
- Loading states: **spinner** (`ActivityIndicator`) throughout — no skeletons for POC.
- Empty on-duty state: "No duty pharmacies found" + tappable **`tel:143`** (SAMU).
- Distance display: **adaptive** — `320 m` below 1 km, `1.2 km` above.
  ```ts
  const fmt = (m: number) => m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`;
  ```
- Phone numbers stored **raw** as scraped. A `toDialable(phone)` utility strips
  spaces and prepends `+225` for the `tel:` URI.
- Directions button uses a **`geo:` URI** (`geo:lat,lng?q=lat,lng(Name)`) —
  opens the user's default maps app (Waze, Google Maps, etc.).
- Detail screen shows on-duty badge + contact name (if available) when the
  pharmacy is currently on duty — same `onDutyNow()` query, checked client-side.

---

## Deferred / to confirm against real data

- `hours` is cosmetic free-text for the POC; structure post-scrape if
  "open now" logic is needed (decided against for POC).
- Final scraped shape — drives `sourceId` strategy and any `dutyShifts`
  adjustments.
- Multi-city expansion (query design + geospatial component).
- Skeleton loading states (deferred post-POC; spinner used for now).
- On-duty map overlay on the on-duty tab (deferred post-POC; list only for now).
