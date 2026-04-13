import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const orderStatus = v.union(
    v.literal("pending"),
    v.literal("confirmed"),
    v.literal("preparing"),
    v.literal("dispatched"),
    v.literal("delivered"),
    v.literal("cancelled"),
);

export const list = query({
    args: {
        userId: v.string(),
        status: v.optional(orderStatus),
    },
    handler: async (ctx, { userId, status }) => {
        const orders = await ctx.db
            .query("orders")
            .withIndex("by_userId", q => q.eq("userId", userId))
            .collect();
        if (status) return orders.filter(o => o.status === status);
        return orders;
    },
});

export const get = query({
    args: { id: v.id("orders"), userId: v.string() },
    handler: async (ctx, { id, userId }) => {
        const order = await ctx.db.get(id);
        if (!order || order.userId !== userId) return null;

        const items = await ctx.db
            .query("orderItems")
            .withIndex("by_order", q => q.eq("orderId", id))
            .collect();

        return { ...order, items };
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("orders"),
        status: v.union(
            v.literal("confirmed"),
            v.literal("preparing"),
            v.literal("dispatched"),
            v.literal("delivered"),
        ),
    },
    handler: async (ctx, { id, status }) => {
        const order = await ctx.db.get(id);
        if (!order) throw new Error("Order not found");
        if (order.status === "cancelled") throw new Error("Cannot update a cancelled order");
        await ctx.db.patch(id, { status });
        return await ctx.db.get(id);
    },
});

export const cancel = mutation({
    args: {
        id: v.id("orders"),
        userId: v.string(),
    },
    handler: async (ctx, { id, userId }) => {
        const order = await ctx.db.get(id);
        if (!order) throw new Error("Order not found");
        if (order.userId !== userId) throw new Error("Not authorized");
        if (order.status !== "pending" && order.status !== "confirmed") {
            throw new Error("Order cannot be cancelled at this stage");
        }

        // Restore inventory quantities
        const orderItems = await ctx.db
            .query("orderItems")
            .withIndex("by_order", q => q.eq("orderId", id))
            .collect();

        for (const item of orderItems) {
            const inv = await ctx.db
                .query("inventory")
                .withIndex("by_pharmacy_medication", q =>
                    q.eq("pharmacyId", order.pharmacyId).eq("medicationId", item.medicationId)
                )
                .unique();
            if (inv) {
                await ctx.db.patch(inv._id, { quantity: inv.quantity + item.quantity });
            }
        }

        await ctx.db.patch(id, {
            status: "cancelled",
            paymentStatus: order.paymentStatus === "paid" ? "refunded" : order.paymentStatus,
        });

        return await ctx.db.get(id);
    },
});
