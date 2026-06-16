# Handoff — Pharmacy Finder POC

Snapshot for resuming on a different machine. Pairs with **[PLAN.md](PLAN.md)**
(the full design + all locked decisions). Read PLAN.md first; this file is the
"where we are / how to resume" layer on top of it.

Last updated: 2026-06-16. Single commit on `main`: `b082ee2` (Phase 0 scaffold).

---

## TL;DR status

- **Phase 0 (scaffold) code is written and committed.** Navigation, deps, and a
  MapLibre map screen centered on Abidjan all exist and **type-check clean**
  (`bunx tsc --noEmit`).
- **The map has NOT yet been seen rendering on a device.** That's the Phase 0
  exit criterion and it's still unverified — we got blocked on Android tooling,
  not on code.
- **Phases 1–4 are not started.** Convex backend is **not initialized** (no
  `convex/` folder, no schema).

---

## What's done (committed)

- Deps installed: `expo-dev-client`, `expo-location`,
  `@maplibre/maplibre-react-native@11.3.4`, `@gorhom/bottom-sheet@5.2.14`,
  `convex@1.41.0` (plus the template's reanimated v4 / gesture-handler).
- `app.json` plugins: `expo-dev-client`, `@maplibre/maplibre-react-native`,
  `expo-location` (+ Android `ACCESS_FINE/COARSE_LOCATION`, package id
  `com.anonymous.pharmacy`).
- Route structure (Expo Router, file-based):
  ```
  src/app/_layout.tsx            Stack: (tabs) + pharmacy/[id]; wraps GestureHandlerRootView
  src/app/(tabs)/_layout.tsx     Tabs: map + on-duty
  src/app/(tabs)/map.tsx         MapLibre map, Abidjan center, OpenFreeMap tiles
  src/app/(tabs)/on-duty.tsx     placeholder (Phase 4)
  src/app/pharmacy/[id].tsx      placeholder (Phase 4)
  ```
- Old template screens (`index.tsx`, `explore.tsx`) deleted.

## What's NOT done

- [ ] **Verify the map renders on a device/emulator** (Phase 0 exit criterion).
- [ ] Phase 1 — Convex: `npx convex dev` to init, then write `convex/schema.ts`
      (schema is already drafted in PLAN.md) + seed data.
- [ ] Phases 2–4 — queries, location wiring, on-duty view, polish.

---

## Resume on a fresh machine — steps

Prereqs to install first (none of these travel in git):
- **Bun** (package manager / scripts)
- **JDK** — 17 is the RN-blessed version; 21 also works with the project's
  Gradle 9.3.1. Set `JAVA_HOME`.
- **Android SDK** with: `platform-tools`, `build-tools;34.0.0`,
  `platforms;android-34`, **`emulator`** + a **system image** (e.g.
  `system-images;android-34;google_apis;x86_64`) — OR a physical device with
  USB debugging. Set `ANDROID_HOME` / `ANDROID_SDK_ROOT` to the SDK path and add
  `platform-tools` + `emulator` to `PATH`.

Then:
```bash
bun install                                   # node_modules not committed
bunx expo prebuild --platform android --clean # android/ is gitignored — regenerate it
# start an emulator or plug in a device, then:
bunx expo run:android                         # local build + install + launch
```
Expected: a street map of Abidjan (Cocody/Plateau area) at zoom 14.
If blank → check Metro logs + device logcat for tile-load errors against
`https://tiles.openfreemap.org/styles/liberty`.

### Convex (Phase 1, when you get there)
`convex/` and `.env.local` are **not** in the repo (`.env.local` is gitignored).
On the new machine run `npx convex dev` to create a deployment; it writes
`CONVEX_DEPLOYMENT` + `CONVEX_URL` into `.env.local` and creates `convex/`.
The schema to drop into `convex/schema.ts` is in PLAN.md (Phase 1).

---

## Gotchas already solved (don't relearn these)

- **MapLibre RN v11 API differs from older docs.** The `Map` prop is
  **`mapStyle`** (not `styleURL`), and `Camera` takes
  **`initialViewState={{ center: [lng, lat], zoom }}`** (not
  `centerCoordinate` / `zoomLevel`). Coords are **[lng, lat]** order.
- **gorhom bottom sheet** needs the app wrapped in `GestureHandlerRootView`
  (done in `src/app/_layout.tsx`) and reanimated — reanimated **v4 needs no
  Babel/config plugin**, so none was added.
- **MapLibre + expo-location are native modules** → cannot run in Expo Go.
  A dev build (`expo run:android`) is mandatory. `android/` must be regenerated
  via `expo prebuild` on each machine (it's gitignored).
- **AGENTS.md rule:** read the exact Expo v56 docs
  (https://docs.expo.dev/versions/v56.0.0/) before writing Expo code.

---

## Key decisions (full list in PLAN.md)

Android-only · local build (no EAS) · OpenFreeMap tiles (no key) · Expo Router ·
root-level `pharmacy/[id]` detail · gorhom bottom-sheet marker callout ·
`nearestPharmacies` limit 20 · 300ms region-change debounce · map zoom 14 ·
Abidjan fallback center `5.3599,-4.0083` · `hours` cosmetic free-text ·
`contactName` optional on `dutyShifts` · real coords via Nominatim geocoding ·
one duty pharmacy per commune per seed week · on-duty tab list-only ·
empty on-duty → SAMU `tel:143` · adaptive distance (m/km) · phone stored raw,
`toDialable()` prepends `+225` · directions via `geo:` URI · spinner loading.
