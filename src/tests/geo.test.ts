import { describe, expect, it } from "bun:test";
import { haversineKm, isOpenNow } from "../../convex/lib/geo";

// ─── haversineKm ────────────────────────────────────────────────────────────

describe("haversineKm", () => {
    it("returns 0 for identical coordinates", () => {
        expect(haversineKm(0, 0, 0, 0)).toBe(0);
    });

    it("is approximately correct for a known distance", () => {
        // Nairobi CBD → JKIA: ~15.5 km
        const dist = haversineKm(-1.2864, 36.8172, -1.3192, 36.9275);
        expect(dist).toBeGreaterThan(10);
        expect(dist).toBeLessThan(20);
    });

    it("is symmetric", () => {
        const a = haversineKm(48.8566, 2.3522, 51.5074, -0.1278); // Paris → London
        const b = haversineKm(51.5074, -0.1278, 48.8566, 2.3522); // London → Paris
        expect(Math.abs(a - b)).toBeLessThan(0.001);
    });

    it("crosses the equator correctly", () => {
        // 1° of latitude ≈ 111 km
        const dist = haversineKm(-0.5, 0, 0.5, 0);
        expect(dist).toBeCloseTo(111, 0);
    });

    it("crosses the prime meridian correctly", () => {
        const dist = haversineKm(0, -0.5, 0, 0.5);
        expect(dist).toBeCloseTo(111, 0);
    });

    it("handles antipodal points (~20,000 km)", () => {
        const dist = haversineKm(0, 0, 0, 180);
        expect(dist).toBeGreaterThan(19000);
        expect(dist).toBeLessThan(21000);
    });
});

// ─── isOpenNow ──────────────────────────────────────────────────────────────

// Monday = day 1, 14:00
const MON_2PM = new Date("2024-01-08T14:00:00");
// Monday = day 1, 07:00
const MON_7AM = new Date("2024-01-08T07:00:00");
// Monday = day 1, 19:00
const MON_7PM = new Date("2024-01-08T19:00:00");
// Sunday = day 0
const SUN_2PM = new Date("2024-01-07T14:00:00");

const MON_HOURS = [{ day: 1, openTime: "08:00", closeTime: "18:00" }];

describe("isOpenNow", () => {
    it("returns true when current time is within operating hours", () => {
        expect(isOpenNow(MON_HOURS, MON_2PM)).toBe(true);
    });

    it("returns false when current time is before opening", () => {
        expect(isOpenNow(MON_HOURS, MON_7AM)).toBe(false);
    });

    it("returns false when current time is after closing", () => {
        expect(isOpenNow(MON_HOURS, MON_7PM)).toBe(false);
    });

    it("returns false when no hours defined for the current day", () => {
        expect(isOpenNow(MON_HOURS, SUN_2PM)).toBe(false);
    });

    it("returns false for empty operating hours", () => {
        expect(isOpenNow([], MON_2PM)).toBe(false);
    });

    it("returns true exactly at opening time", () => {
        const atOpen = new Date("2024-01-08T08:00:00");
        expect(isOpenNow(MON_HOURS, atOpen)).toBe(true);
    });

    it("returns true exactly at closing time", () => {
        const atClose = new Date("2024-01-08T18:00:00");
        expect(isOpenNow(MON_HOURS, atClose)).toBe(true);
    });

    it("returns true when matching one of multiple day slots", () => {
        const hours = [
            { day: 0, openTime: "10:00", closeTime: "16:00" },
            { day: 1, openTime: "08:00", closeTime: "18:00" },
        ];
        expect(isOpenNow(hours, MON_2PM)).toBe(true);
        expect(isOpenNow(hours, SUN_2PM)).toBe(true);
    });

    it("uses wall-clock time when no `now` argument is passed", () => {
        // Just verifies it doesn't throw and returns a boolean
        expect(typeof isOpenNow(MON_HOURS)).toBe("boolean");
    });
});
