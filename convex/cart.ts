import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const getActive = query({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const cart = await ctx.db
            .query("carts")
            .withIndex("by_userId_status", q =>
                q.eq("userId", userId).eq("status", "active")
            )
            .unique();
        if (!cart) return null;

        const items = await ctx.db
            .query("cartItems")
            .withIndex("by_cart", q => q.eq("cartId", cart._id))
            .collect();

        const enriched = await Promise.all(
            items.map(async item => {
                const medication = await ctx.db.get(item.medicationId);
                const inventory = await ctx.db.get(item.inventoryId);
                return { ...item, medication, inventory };
            })
        );

        return { ...cart, items: enriched };
    },
});

export const addItem = mutation({
    args: {
        userId: v.string(),
        pharmacyId: v.id("pharmacies"),
        inventoryId: v.id("inventory"),
        medicationId: v.id("medications"),
        quantity: v.number(),
    },
    handler: async (ctx, { userId, pharmacyId, inventoryId, medicationId, quantity }) => {
        const inventoryItem = await ctx.db.get(inventoryId);
        if (!inventoryItem) throw new Error("Inventory item not found");
        if (!inventoryItem.isAvailable) throw new Error("Item is not available");
        if (inventoryItem.quantity < quantity) throw new Error("Insufficient stock");

        const existingCart = await ctx.db
            .query("carts")
            .withIndex("by_userId_status", q =>
                q.eq("userId", userId).eq("status", "active")
            )
            .unique();

        let cartId: Id<"carts">;
        if (existingCart) {
            if (existingCart.pharmacyId !== pharmacyId) {
                throw new Error(
                    "Cart already contains items from a different pharmacy. Clear your cart first."
                );
            }
            cartId = existingCart._id;
        } else {
            cartId = await ctx.db.insert("carts", { userId, pharmacyId, status: "active" });
        }

        const existingItem = await ctx.db
            .query("cartItems")
            .withIndex("by_cart", q => q.eq("cartId", cartId))
            .filter(q => q.eq(q.field("inventoryId"), inventoryId))
            .unique();

        if (existingItem) {
            await ctx.db.patch(existingItem._id, { quantity: existingItem.quantity + quantity });
            return existingItem._id;
        }

        return await ctx.db.insert("cartItems", { cartId, medicationId, inventoryId, quantity });
    },
});

export const updateItem = mutation({
    args: {
        userId: v.string(),
        cartItemId: v.id("cartItems"),
        quantity: v.number(),
    },
    handler: async (ctx, { userId, cartItemId, quantity }) => {
        const item = await ctx.db.get(cartItemId);
        if (!item) throw new Error("Cart item not found");

        const cart = await ctx.db.get(item.cartId);
        if (!cart || cart.userId !== userId) throw new Error("Not authorized");
        if (cart.status !== "active") throw new Error("Cart is no longer active");

        if (quantity <= 0) {
            await ctx.db.delete(cartItemId);
            return null;
        }

        await ctx.db.patch(cartItemId, { quantity });
        return cartItemId;
    },
});

export const removeItem = mutation({
    args: {
        userId: v.string(),
        cartItemId: v.id("cartItems"),
    },
    handler: async (ctx, { userId, cartItemId }) => {
        const item = await ctx.db.get(cartItemId);
        if (!item) throw new Error("Cart item not found");

        const cart = await ctx.db.get(item.cartId);
        if (!cart || cart.userId !== userId) throw new Error("Not authorized");

        await ctx.db.delete(cartItemId);

        const remaining = await ctx.db
            .query("cartItems")
            .withIndex("by_cart", q => q.eq("cartId", cart._id))
            .collect();

        if (remaining.length === 0) {
            await ctx.db.patch(cart._id, { status: "abandoned" });
        }

        return { deleted: cartItemId };
    },
});

export const checkout = mutation({
    args: {
        userId: v.string(),
        deliveryAddressId: v.id("savedAddresses"),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, { userId, deliveryAddressId, notes }) => {
        const cart = await ctx.db
            .query("carts")
            .withIndex("by_userId_status", q =>
                q.eq("userId", userId).eq("status", "active")
            )
            .unique();
        if (!cart) throw new Error("No active cart found");

        const items = await ctx.db
            .query("cartItems")
            .withIndex("by_cart", q => q.eq("cartId", cart._id))
            .collect();
        if (items.length === 0) throw new Error("Cart is empty");

        const address = await ctx.db.get(deliveryAddressId);
        if (!address || address.userId !== userId) throw new Error("Address not found");

        // Validate stock and compute totals
        let subtotal = 0;
        const lineItems = [];
        for (const item of items) {
            const inv = await ctx.db.get(item.inventoryId);
            if (!inv) throw new Error("Inventory item no longer exists");
            if (!inv.isAvailable) throw new Error("An item in your cart is no longer available");
            if (inv.quantity < item.quantity) throw new Error("Insufficient stock for an item in your cart");

            const med = await ctx.db.get(item.medicationId);
            if (!med) throw new Error("Medication not found");

            const lineTotal = inv.price * item.quantity;
            subtotal += lineTotal;
            lineItems.push({ item, inv, med, lineTotal });
        }

        const deliveryFee = 5.0;
        const total = subtotal + deliveryFee;
        const currency = lineItems[0].inv.currency;

        const orderId = await ctx.db.insert("orders", {
            userId,
            pharmacyId: cart.pharmacyId,
            deliveryAddressId,
            status: "pending",
            subtotal,
            deliveryFee,
            total,
            currency,
            paymentStatus: "unpaid",
            notes,
        });

        for (const { item, inv, med, lineTotal } of lineItems) {
            await ctx.db.insert("orderItems", {
                orderId,
                medicationId: item.medicationId,
                name: med.name,
                quantity: item.quantity,
                unitPrice: inv.price,
                totalPrice: lineTotal,
            });
            await ctx.db.patch(item.inventoryId, { quantity: inv.quantity - item.quantity });
        }

        await ctx.db.patch(cart._id, { status: "checked_out" });

        return { orderId };
    },
});
