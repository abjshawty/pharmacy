import { query } from "./_generated/server";
import { v } from "convex/values";
import { haversineKm, isOpenNow } from "./lib/geo";

export const nearby = query({
    args: {
        lat: v.number(),
        lng: v.number(),
        radiusKm: v.optional(v.number()),
        openOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, { lat, lng, radiusKm = 10, openOnly = false }) => {
        const pharmacies = await ctx.db
            .query("pharmacies")
            .filter(q => q.eq(q.field("isActive"), true))
            .collect();

        const results = pharmacies
            .map(p => ({
                ...p,
                distanceKm: haversineKm(lat, lng, p.lat, p.lng),
                isOpen: isOpenNow(p.operatingHours),
            }))
            .filter(p => p.distanceKm <= radiusKm)
            .filter(p => !openOnly || p.isOpen)
            .sort((a, b) => a.distanceKm - b.distanceKm);

        return results;
    },
});
