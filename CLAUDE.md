# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Pharmacy Finder — a POC React Native (Expo) app to browse nearby pharmacies and
on-duty (*pharmacie de garde*) pharmacies in Abidjan. **Android-only**, anonymous
(no auth), seeded mock data for now (real data via scraping later).

Read **[PLAN.md](PLAN.md)** for the full design and every locked decision, and
**[HANDOFF.md](HANDOFF.md)** for current status. Current state: Phase 0 is
**complete** — the MapLibre map has been **verified rendering on a physical
device** (OpenFreeMap tiles, Abidjan at zoom 14), and the project type-checks
clean. The Convex backend is **not initialized** (no `convex/` folder, no
`convex/schema.ts` — the schema is drafted in PLAN.md Phase 1). Phases 1–4 are
unstarted.

## Commands

Package manager is **Bun**, not npm (despite the `package.json` script names).

```bash
bun install                                    # node_modules is gitignored
bunx tsc --noEmit                              # type-check (the de-facto CI gate)
bun run lint                                   # expo lint
bunx expo prebuild --platform android --clean  # regenerate android/ (gitignored)
bunx expo run:android                          # local dev build + install + launch
```

There is **no test runner configured** and **no Convex deployment yet**. When
Phase 1 starts, `npx convex dev` initializes the deployment, writes
`CONVEX_DEPLOYMENT`/`CONVEX_URL` into `.env.local` (gitignored), and creates
`convex/`.

## Hard constraints

- **Cannot run in Expo Go.** MapLibre and expo-location are native modules, so a
  dev build (`expo run:android`) is mandatory — Expo Go will not work.
- **`android/` is gitignored** and must be regenerated with `expo prebuild` on
  each machine. Prereqs (Bun, JDK 21, Android SDK/emulator) don't travel in git;
  see HANDOFF.md.
- **Read the exact Expo v56 docs** (https://docs.expo.dev/versions/v56.0.0/)
  before writing Expo code — the API changed across versions (this is the
  AGENTS.md rule imported above).

## Architecture

- **Navigation: Expo Router (file-based), typed routes enabled.** Routes live
  under `src/app/`. `src/app/_layout.tsx` is the root Stack ((tabs) +
  `pharmacy/[id]`) wrapped in `GestureHandlerRootView` (required by gorhom
  bottom-sheet). `src/app/(tabs)/_layout.tsx` holds the map + on-duty tabs.
  `pharmacy/[id]` is a **root-level** detail screen reachable from both tabs.
- **Backend: Convex** (reactive queries). Three planned queries —
  `nearestPharmacies` (priority load, limit 20, haversine sort in-query),
  `pharmaciesInBounds` (progressive fill on 300ms-debounced map region change),
  and `onDutyNow` (computes the Saturday-08:00→next-Saturday-08:00 GMT window).
- **Map: MapLibre via `@maplibre/maplibre-react-native` v11**, tiles from
  **OpenFreeMap** (`https://tiles.openfreemap.org/styles/liberty`, no API key).
  Coordinates are **[lng, lat]** order. The v11 API differs from older docs:
  the `Map` prop is **`mapStyle`** (not `styleURL`), and `Camera` takes
  **`initialViewState={{ center: [lng, lat], zoom }}`** (not
  `centerCoordinate`/`zoomLevel`). See `src/app/(tabs)/map.tsx`.
- **Path alias:** `@/*` → `src/*`, `@/assets/*` → `assets/*` (tsconfig). Strict
  TypeScript and the React Compiler are both on.
- **Platform-split files:** components use `.web.tsx`/`.tsx` and
  `use-color-scheme.web.ts` variants — keep both in sync when editing.

## Conventions baked into the plan

Abidjan is GMT (UTC+0, no DST), so duty windows are plain ms-epoch comparisons —
no timezone math. Location-denied falls back to Abidjan center `5.3599, -4.0083`.
Phone numbers are stored raw; a `toDialable()` helper strips spaces and prepends
`+225`. Distances are adaptive (`m` below 1 km, `km` above). Directions use a
`geo:` URI. Loading uses `ActivityIndicator` spinners (no skeletons for the POC).
