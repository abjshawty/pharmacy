import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pharmacies: defineTable({
    name: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    phone: v.optional(v.string()),
    hours: v.optional(v.string()), // free text for now; structure post-scrape
    commune: v.optional(v.string()),
    sourceId: v.optional(v.string()), // stable key for scraper upserts
  }).index("by_lat", ["lat"]),

  dutyShifts: defineTable({
    pharmacyId: v.id("pharmacies"),
    startsAt: v.number(), // ms epoch — Saturday 08:00 handover
    endsAt: v.number(), // ms epoch — following Saturday 08:00
    contactName: v.optional(v.string()), // duty pharmacist name; sparse — only some sources provide it
  })
    .index("by_window", ["startsAt", "endsAt"])
    .index("by_pharmacy", ["pharmacyId"]),
});
