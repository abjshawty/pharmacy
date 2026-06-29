# Handoff — Pharmacy Finder POC

Snapshot for resuming on a different machine. Pairs with **[PLAN.md](PLAN.md)**
(the full design + all locked decisions). Read PLAN.md first; this file is the
"where we are / how to resume" layer on top of it.

Last updated: 2026-06-17. Phase 0 scaffold committed (`b082ee2`); the map-render
verification + Windows toolchain fixes below are **working-tree changes, not yet
committed**.

---

## TL;DR status

- **Phase 0 is COMPLETE.** The MapLibre map was **verified rendering on a
  physical device** (OpenFreeMap tiles, Abidjan at zoom 14, Map/On-Duty tabs) on
  2026-06-17. The Android tooling that blocked this is now set up (see below).
- **Phase 1 (data model) is COMPLETE.** Convex is initialized as a **local
  anonymous deployment** (`anonymous:anonymous-pharmacy` @ `127.0.0.1:3210`, no
  cloud login). `convex/schema.ts` (pharmacies + dutyShifts) is pushed and
  `convex/seed.ts` populated **17 pharmacies across 11 communes + 11 duty
  shifts** for the current Sat→Sat window. `tsc` clean. These are uncommitted
  working-tree changes.
- **Phase 2 (queries) is COMPLETE.** `convex/pharmacies.ts`
  (`nearestPharmacies` — haversine sort, limit 20; `pharmaciesInBounds` —
  by_lat range scan + lng filter) and `convex/onDuty.ts` (`onDutyNow` —
  by_window scan joined to pharmacies). Duty-window math extracted to the
  shared `convex/dutyWindow.ts`. All three verified against the seed; `tsc`
  clean. Uncommitted working-tree changes.
- **Phases 3–4 are not started** (location wiring + map markers, on-duty view).
  No Convex client wiring in the app yet (`ConvexProvider` not added).

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

- Route fix: the `(tabs)` group had no index route, so launching at `/`
  ("`pharmacy:///`") hit Expo Router's "Unmatched Route" 404. Renamed
  `(tabs)/map.tsx` → `(tabs)/index.tsx` (and the `Tabs.Screen name` in
  `(tabs)/_layout.tsx` from `"map"` → `"index"`) so the map is the default tab.
- Deleted unused template leftovers `src/components/app-tabs.tsx` +
  `app-tabs.web.tsx` (nothing imported them; they referenced the deleted
  `/explore` route and were the only `tsc` errors).

## What's NOT done

- [ ] Phase 1 — Convex: `npx convex dev` to init, then write `convex/schema.ts`
      (schema is already drafted in PLAN.md) + seed data.
- [ ] Phases 2–4 — queries, location wiring, on-duty view, polish.
- [ ] Commit the working-tree changes above (map verified + route/cleanup).

---

## Resume on a fresh machine — steps

Prereqs to install first (none of these travel in git):
- **Bun** (package manager / scripts)
- **JDK 21 — the whole build now compiles with Java 21.** RN's Gradle plugin
  otherwise forces a Java-17 toolchain (`jvmToolchain(17)`) on every module, and
  with *only* JDK 21 installed Gradle 9.3.1 tries to auto-download a 17 via the
  bundled Foojay resolver (v0.5.0), which references `JvmVendorSpec.IBM_SEMERU` —
  a constant Gradle 9.3 removed — so the build dies with `NoSuchFieldError`.
  **Fix (current setup):** the `plugins/withJava21.js` config plugin sets
  `react.internal.disableJavaVersionAlignment=true` and re-aligns every module to
  Java 21 (compileOptions + `jvmToolchain(21)`). Since the daemon runs on JDK 21,
  the 21 toolchain resolves to the running JDK — the broken downloader is never
  invoked and no JDK 17 is needed. Set `JAVA_HOME` to your JDK 21 (e.g.
  `C:\Program Files\Zulu\zulu-21`); the plugin reproduces the Gradle changes on
  every `expo prebuild` (they live in app.json's plugin list, not gitignored
  `android/`).
- **Android SDK** with: `platform-tools`, `platforms;android-36`,
  `build-tools;36.0.0`, **`ndk;27.1.12297006`**, **`cmake;3.22.1`** (the NDK +
  CMake are needed because `newArchEnabled=true` compiles native C++ from
  source) — plus a physical device with USB debugging, OR `emulator` + a system
  image. Set `ANDROID_HOME` / `ANDROID_SDK_ROOT` (user scope) and add
  `platform-tools` to `PATH`. If a stale Gradle daemon was started before
  `ANDROID_HOME` existed, it caches "SDK location not found" — write
  `android/local.properties` (`sdk.dir=...`) and/or `gradlew --stop`, then
  rebuild.

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

### Convex (Phase 1 — done, runs locally)
`convex/` (schema, seed, `_generated`) **is** committed; `.env.local` is **not**
(gitignored — it holds `CONVEX_DEPLOYMENT=anonymous:anonymous-pharmacy`,
`CONVEX_URL=http://127.0.0.1:3210`, and the local admin key). The deployment is
**local + anonymous** — no Convex account needed. On a fresh machine the
`.env.local`/local backend state under `~/.convex` won't exist, so re-init:
```bash
bunx convex dev --once     # recreates the local anonymous deployment + pushes schema
bunx convex run seed:seed  # repopulate 17 pharmacies + 11 duty shifts
```
For day-to-day work run `bunx convex dev` (long-running) alongside Metro so the
app can query the backend. If the local backend ever fails to start with
`Cannot read properties of undefined (reading 'toString')`, the cached state is
stale — delete `~/.convex/anonymous-convex-backend-state/anonymous-pharmacy` and
re-run (no real data to lose). `seed:seed` is idempotent (wipes then re-inserts)
and recomputes the current Sat→Sat duty window each run.

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
