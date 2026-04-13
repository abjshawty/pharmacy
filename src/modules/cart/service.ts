import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/src/client";
import type { Model } from "./model";

export abstract class Service {
    static async getActive(userId: string) {
        return await convex.query(api.cart.getActive, { userId });
    }

    static async addItem(userId: string, body: Model.addItemBody) {
        return await convex.mutation(api.cart.addItem, {
            userId,
            pharmacyId: body.pharmacyId as Id<"pharmacies">,
            inventoryId: body.inventoryId as Id<"inventory">,
            medicationId: body.medicationId as Id<"medications">,
            quantity: body.quantity,
        });
    }

    static async updateItem(userId: string, cartItemId: string, body: Model.updateItemBody) {
        return await convex.mutation(api.cart.updateItem, {
            userId,
            cartItemId: cartItemId as Id<"cartItems">,
            quantity: body.quantity,
        });
    }

    static async removeItem(userId: string, cartItemId: string) {
        return await convex.mutation(api.cart.removeItem, {
            userId,
            cartItemId: cartItemId as Id<"cartItems">,
        });
    }

    static async checkout(userId: string, body: Model.checkoutBody) {
        return await convex.mutation(api.cart.checkout, {
            userId,
            deliveryAddressId: body.deliveryAddressId as Id<"savedAddresses">,
            notes: body.notes,
        });
    }
}
