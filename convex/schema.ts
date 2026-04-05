import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

    // ── Legacy (template) ────────────────────────────────────────────────
    posts: defineTable({
        title: v.string(),
        content: v.string(),
    }),

    // ── User profiles ────────────────────────────────────────────────────
    userProfiles: defineTable({
        authUserId: v.string(),
        displayName: v.optional(v.string()),
        phone: v.optional(v.string()),
    }).index("by_authUserId", ["authUserId"]),

    savedAddresses: defineTable({
        userId: v.string(),
        label: v.string(),
        street: v.string(),
        city: v.string(),
        country: v.string(),
        postalCode: v.optional(v.string()),
        lat: v.number(),
        lng: v.number(),
        isDefault: v.boolean(),
    }).index("by_userId", ["userId"]),

    // ── Pharmacies ───────────────────────────────────────────────────────
    pharmacies: defineTable({
        name: v.string(),
        address: v.string(),
        city: v.string(),
        country: v.string(),
        lat: v.number(),
        lng: v.number(),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        isActive: v.boolean(),
        operatingHours: v.array(v.object({
            day: v.number(),       // 0 = Sunday … 6 = Saturday
            openTime: v.string(),  // "08:00"
            closeTime: v.string(), // "22:00"
        })),
    }).index("by_city", ["city"]),

    // ── Medications (global catalog) ─────────────────────────────────────
    medications: defineTable({
        name: v.string(),
        genericName: v.optional(v.string()),
        brand: v.optional(v.string()),
        category: v.string(),
        description: v.optional(v.string()),
        requiresPrescription: v.boolean(),
        dosageForms: v.array(v.string()),
    })
        .index("by_name", ["name"])
        .index("by_category", ["category"])
        .searchIndex("search_name", { searchField: "name", filterFields: ["category"] }),

    // ── Inventory ────────────────────────────────────────────────────────
    inventory: defineTable({
        pharmacyId: v.id("pharmacies"),
        medicationId: v.id("medications"),
        quantity: v.number(),
        price: v.number(),
        currency: v.string(),
        isAvailable: v.boolean(),
    })
        .index("by_pharmacy", ["pharmacyId"])
        .index("by_medication", ["medicationId"])
        .index("by_pharmacy_medication", ["pharmacyId", "medicationId"]),

    // ── Carts ────────────────────────────────────────────────────────────
    carts: defineTable({
        userId: v.string(),
        pharmacyId: v.id("pharmacies"),
        status: v.union(
            v.literal("active"),
            v.literal("checked_out"),
            v.literal("abandoned"),
        ),
    }).index("by_userId_status", ["userId", "status"]),

    cartItems: defineTable({
        cartId: v.id("carts"),
        medicationId: v.id("medications"),
        inventoryId: v.id("inventory"),
        quantity: v.number(),
    }).index("by_cart", ["cartId"]),

    // ── Orders ───────────────────────────────────────────────────────────
    orders: defineTable({
        userId: v.string(),
        pharmacyId: v.id("pharmacies"),
        deliveryAddressId: v.id("savedAddresses"),
        status: v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("preparing"),
            v.literal("dispatched"),
            v.literal("delivered"),
            v.literal("cancelled"),
        ),
        subtotal: v.number(),
        deliveryFee: v.number(),
        total: v.number(),
        currency: v.string(),
        paymentStatus: v.union(
            v.literal("unpaid"),
            v.literal("paid"),
            v.literal("refunded"),
        ),
        prescriptionId: v.optional(v.id("prescriptions")),
        notes: v.optional(v.string()),
    })
        .index("by_userId", ["userId"])
        .index("by_pharmacyId", ["pharmacyId"])
        .index("by_status", ["status"]),

    orderItems: defineTable({
        orderId: v.id("orders"),
        medicationId: v.id("medications"),
        name: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        totalPrice: v.number(),
    }).index("by_order", ["orderId"]),

    // ── Deliveries ───────────────────────────────────────────────────────
    deliveries: defineTable({
        orderId: v.id("orders"),
        courierId: v.optional(v.string()),
        status: v.union(
            v.literal("pending"),
            v.literal("assigned"),
            v.literal("in_transit"),
            v.literal("delivered"),
            v.literal("failed"),
        ),
        estimatedDeliveryAt: v.optional(v.number()),
        deliveredAt: v.optional(v.number()),
        courierLat: v.optional(v.number()),
        courierLng: v.optional(v.number()),
        trackingNotes: v.optional(v.string()),
    }).index("by_order", ["orderId"]),

    // ── Payments ─────────────────────────────────────────────────────────
    payments: defineTable({
        orderId: v.id("orders"),
        userId: v.string(),
        amount: v.number(),
        currency: v.string(),
        provider: v.literal("stripe"),
        providerPaymentId: v.string(),
        status: v.union(
            v.literal("created"),
            v.literal("processing"),
            v.literal("succeeded"),
            v.literal("failed"),
            v.literal("refunded"),
        ),
    })
        .index("by_order", ["orderId"])
        .index("by_providerPaymentId", ["providerPaymentId"]),

    // ── Prescriptions ─────────────────────────────────────────────────────
    prescriptions: defineTable({
        userId: v.string(),
        imageStorageId: v.string(),
        ocrRawText: v.optional(v.string()),
        extractedItems: v.array(v.object({
            rawText: v.string(),
            medicationId: v.optional(v.id("medications")),
            matchedName: v.optional(v.string()),
            dosage: v.optional(v.string()),
            confidence: v.number(),
        })),
        status: v.union(
            v.literal("pending"),
            v.literal("processing"),
            v.literal("processed"),
            v.literal("verified"),
        ),
    })
        .index("by_userId", ["userId"])
        .index("by_status", ["status"]),
});
