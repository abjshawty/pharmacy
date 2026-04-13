import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {
        pharmacyId: v.optional(v.id("pharmacies")),
        medicationId: v.optional(v.id("medications")),
    },
    handler: async (ctx, { pharmacyId, medicationId }) => {
        if (pharmacyId && medicationId) {
            return await ctx.db
                .query("inventory")
                .withIndex("by_pharmacy_medication", q =>
                    q.eq("pharmacyId", pharmacyId).eq("medicationId", medicationId)
                )
                .collect();
        }
        if (pharmacyId) {
            return await ctx.db
                .query("inventory")
                .withIndex("by_pharmacy", q => q.eq("pharmacyId", pharmacyId))
                .collect();
        }
        if (medicationId) {
            return await ctx.db
                .query("inventory")
                .withIndex("by_medication", q => q.eq("medicationId", medicationId))
                .collect();
        }
        return await ctx.db.query("inventory").collect();
    },
});

export const get = query({
    args: { id: v.id("inventory") },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

export const upsert = mutation({
    args: {
        pharmacyId: v.id("pharmacies"),
        medicationId: v.id("medications"),
        quantity: v.number(),
        price: v.number(),
        currency: v.string(),
        isAvailable: v.boolean(),
    },
    handler: async (ctx, { pharmacyId, medicationId, ...rest }) => {
        const existing = await ctx.db
            .query("inventory")
            .withIndex("by_pharmacy_medication", q =>
                q.eq("pharmacyId", pharmacyId).eq("medicationId", medicationId)
            )
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, rest);
            return existing._id;
        }
        return await ctx.db.insert("inventory", { pharmacyId, medicationId, ...rest });
    },
});

export const update = mutation({
    args: {
        id: v.id("inventory"),
        quantity: v.optional(v.number()),
        price: v.optional(v.number()),
        currency: v.optional(v.string()),
        isAvailable: v.optional(v.boolean()),
    },
    handler: async (ctx, { id, ...patch }) => {
        const item = await ctx.db.get(id);
        if (!item) throw new Error("Inventory item not found");
        await ctx.db.patch(id, patch);
        return await ctx.db.get(id);
    },
});
