import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const operatingHourSchema = v.object({
    day: v.number(),
    openTime: v.string(),
    closeTime: v.string(),
});

export const create = mutation({
    args: {
        name: v.string(),
        address: v.string(),
        city: v.string(),
        country: v.string(),
        lat: v.number(),
        lng: v.number(),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        operatingHours: v.array(operatingHourSchema),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("pharmacies", { ...args, isActive: true });
    },
});

export const list = query({
    args: { city: v.optional(v.string()) },
    handler: async (ctx, { city }) => {
        if (city) {
            return await ctx.db
                .query("pharmacies")
                .withIndex("by_city", q => q.eq("city", city))
                .filter(q => q.eq(q.field("isActive"), true))
                .collect();
        }
        return await ctx.db
            .query("pharmacies")
            .filter(q => q.eq(q.field("isActive"), true))
            .collect();
    },
});

export const get = query({
    args: { id: v.id("pharmacies") },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

export const update = mutation({
    args: {
        id: v.id("pharmacies"),
        name: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
        operatingHours: v.optional(v.array(operatingHourSchema)),
    },
    handler: async (ctx, { id, ...patch }) => {
        const pharmacy = await ctx.db.get(id);
        if (!pharmacy) throw new Error("Pharmacy not found");
        return await ctx.db.patch(id, patch);
    },
});
