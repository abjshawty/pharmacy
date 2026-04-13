import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/src/client";
import type { Model } from "./model";

export abstract class Service {
    static async list(query: Model.listQuery) {
        return await convex.query(api.inventory.list, {
            pharmacyId: query.pharmacyId as Id<"pharmacies"> | undefined,
            medicationId: query.medicationId as Id<"medications"> | undefined,
        });
    }

    static async get(id: string) {
        return await convex.query(api.inventory.get, {
            id: id as Id<"inventory">,
        });
    }

    static async upsert(body: Model.upsertBody) {
        return await convex.mutation(api.inventory.upsert, {
            pharmacyId: body.pharmacyId as Id<"pharmacies">,
            medicationId: body.medicationId as Id<"medications">,
            quantity: body.quantity,
            price: body.price,
            currency: body.currency,
            isAvailable: body.isAvailable,
        });
    }

    static async update(id: string, body: Model.updateBody) {
        return await convex.mutation(api.inventory.update, {
            id: id as Id<"inventory">,
            ...body,
        });
    }
}
