import { query } from "./_generated/server";
import { v } from "convex/values";

/** Haversine distance in kilometres between two lat/lng points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isOpenNow(operatingHours: { day: number; openTime: string; closeTime: string }[]): boolean {
    const now = new Date();
    const day = now.getDay();
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    const current = `${hh}:${mm}`;
    const slot = operatingHours.find(h => h.day === day);
    if (!slot) return false;
    return current >= slot.openTime && current <= slot.closeTime;
}

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
