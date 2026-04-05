import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getProfile = query({
    args: { authUserId: v.string() },
    handler: async (ctx, { authUserId }) => {
        return await ctx.db
            .query("userProfiles")
            .withIndex("by_authUserId", q => q.eq("authUserId", authUserId))
            .unique();
    },
});

export const upsertProfile = mutation({
    args: {
        authUserId: v.string(),
        displayName: v.optional(v.string()),
        phone: v.optional(v.string()),
    },
    handler: async (ctx, { authUserId, displayName, phone }) => {
        const existing = await ctx.db
            .query("userProfiles")
            .withIndex("by_authUserId", q => q.eq("authUserId", authUserId))
            .unique();

        const patch = {
            ...(displayName !== undefined && { displayName }),
            ...(phone !== undefined && { phone }),
        };

        if (existing) {
            await ctx.db.patch(existing._id, patch);
            return existing._id;
        }

        return await ctx.db.insert("userProfiles", { authUserId, ...patch });
    },
});

export const listAddresses = query({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        return await ctx.db
            .query("savedAddresses")
            .withIndex("by_userId", q => q.eq("userId", userId))
            .collect();
    },
});

export const addAddress = mutation({
    args: {
        userId: v.string(),
        label: v.string(),
        street: v.string(),
        city: v.string(),
        country: v.string(),
        postalCode: v.optional(v.string()),
        lat: v.number(),
        lng: v.number(),
        isDefault: v.boolean(),
    },
    handler: async (ctx, args) => {
        // If this is being set as default, unset any existing default
        if (args.isDefault) {
            const existing = await ctx.db
                .query("savedAddresses")
                .withIndex("by_userId", q => q.eq("userId", args.userId))
                .collect();
            for (const addr of existing) {
                if (addr.isDefault) await ctx.db.patch(addr._id, { isDefault: false });
            }
        }
        return await ctx.db.insert("savedAddresses", args);
    },
});

export const removeAddress = mutation({
    args: { id: v.id("savedAddresses"), userId: v.string() },
    handler: async (ctx, { id, userId }) => {
        const addr = await ctx.db.get(id);
        if (!addr || addr.userId !== userId) throw new Error("Address not found");
        await ctx.db.delete(id);
    },
});

export const setDefaultAddress = mutation({
    args: { id: v.id("savedAddresses"), userId: v.string() },
    handler: async (ctx, { id, userId }) => {
        const all = await ctx.db
            .query("savedAddresses")
            .withIndex("by_userId", q => q.eq("userId", userId))
            .collect();
        for (const addr of all) {
            await ctx.db.patch(addr._id, { isDefault: addr._id === id });
        }
    },
});
