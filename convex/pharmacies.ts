import { v } from "convex/values";
import { query } from "./_generated/server";

// Great-circle distance in metres. Used to sort the priority "nearby" load
// in-query — fine for a single-city dataset; swap for @convex-dev/geospatial
// if this ever goes multi-city (see PLAN.md).
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000; // Earth radius, metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Priority load: the N pharmacies closest to the user. Collects every row
// (small dataset), sorts by haversine, returns the top N each tagged with its
// distance in metres. Limit defaults to 20 (PLAN.md).
export const nearestPharmacies = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { lat, lng, limit }) => {
    const pharmacies = await ctx.db.query("pharmacies").collect();
    return pharmacies
      .map((p) => ({ ...p, distanceM: haversineMeters(lat, lng, p.lat, p.lng) }))
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, limit ?? 20);
  },
});

// Single pharmacy by id, for the detail screen.
export const get = query({
  args: { id: v.id("pharmacies") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

// Progressive fill as the user pans/zooms. The client debounces region-change
// (300ms) and refetches for the new viewport. Range-scans the by_lat index for
// the latitude band, then filters longitude in memory.
export const pharmaciesInBounds = query({
  args: {
    minLat: v.number(),
    maxLat: v.number(),
    minLng: v.number(),
    maxLng: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { minLat, maxLat, minLng, maxLng, limit }) => {
    const inLatBand = await ctx.db
      .query("pharmacies")
      .withIndex("by_lat", (q) => q.gte("lat", minLat).lte("lat", maxLat))
      .collect();
    return inLatBand
      .filter((p) => p.lng >= minLng && p.lng <= maxLng)
      .slice(0, limit ?? 200);
  },
});
