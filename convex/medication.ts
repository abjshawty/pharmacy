import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        name: v.string(),
        genericName: v.optional(v.string()),
        brand: v.optional(v.string()),
        category: v.string(),
        description: v.optional(v.string()),
        requiresPrescription: v.boolean(),
        dosageForms: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("medications", args);
    },
});

export const list = query({
    args: {
        category: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { category, limit }) => {
        const max = limit ?? 50;
        if (category) {
            return await ctx.db
                .query("medications")
                .withIndex("by_category", q => q.eq("category", category))
                .take(max);
        }
        return await ctx.db.query("medications").take(max);
    },
});

export const search = query({
    args: {
        q: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, { q, category }) => {
        let searchQuery = ctx.db
            .query("medications")
            .withSearchIndex("search_name", s => {
                const base = s.search("name", q);
                return category ? base.eq("category", category) : base;
            });
        return await searchQuery.take(20);
    },
});

export const get = query({
    args: { id: v.id("medications") },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

export const update = mutation({
    args: {
        id: v.id("medications"),
        name: v.optional(v.string()),
        genericName: v.optional(v.string()),
        brand: v.optional(v.string()),
        category: v.optional(v.string()),
        description: v.optional(v.string()),
        requiresPrescription: v.optional(v.boolean()),
        dosageForms: v.optional(v.array(v.string())),
    },
    handler: async (ctx, { id, ...patch }) => {
        const med = await ctx.db.get(id);
        if (!med) throw new Error("Medication not found");
        return await ctx.db.patch(id, patch);
    },
});
