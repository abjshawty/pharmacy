/** Haversine distance in kilometres between two lat/lng points. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export type OperatingHour = { day: number; openTime: string; closeTime: string };

/**
 * Returns true if the current wall-clock time falls within any of the
 * provided operating hour slots.
 * Accepts an optional `now` parameter for deterministic testing.
 */
export function isOpenNow(hours: OperatingHour[], now: Date = new Date()): boolean {
    const day = now.getDay();
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    const current = `${hh}:${mm}`;
    const slot = hours.find(h => h.day === day);
    if (!slot) return false;
    return current >= slot.openTime && current <= slot.closeTime;
}
