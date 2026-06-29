import { query } from "./_generated/server";
import { currentDutyWindow } from "./dutyWindow";

// The pharmacies on garde for the current Saturday→Saturday window. Range-scans
// the by_window index for shifts that have already started (startsAt <= now),
// filters to those still active (endsAt > now), and joins to the pharmacy row.
// Argless by design — the on-duty tab sorts by distance client-side (Phase 4).
export const onDutyNow = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const { startsAt, endsAt } = currentDutyWindow(now);

    const started = await ctx.db
      .query("dutyShifts")
      .withIndex("by_window", (q) => q.lte("startsAt", now))
      .collect();
    const active = started.filter((shift) => shift.endsAt > now);

    const results = [];
    for (const shift of active) {
      const pharmacy = await ctx.db.get(shift.pharmacyId);
      if (pharmacy === null) continue; // shift orphaned (pharmacy deleted) — skip
      results.push({
        ...pharmacy,
        contactName: shift.contactName,
        dutyStartsAt: shift.startsAt,
        dutyEndsAt: shift.endsAt,
      });
    }

    // Echo the computed window so the client can show "on duty until …".
    return { window: { startsAt, endsAt }, pharmacies: results };
  },
});
