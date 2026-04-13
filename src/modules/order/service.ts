import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/src/client";
import type { Model } from "./model";

export abstract class Service {
    static async list(userId: string, query: Model.listQuery) {
        return await convex.query(api.order.list, {
            userId,
            status: query.status,
        });
    }

    static async get(userId: string, id: string) {
        return await convex.query(api.order.get, {
            id: id as Id<"orders">,
            userId,
        });
    }

    static async updateStatus(id: string, body: Model.updateStatusBody) {
        return await convex.mutation(api.order.updateStatus, {
            id: id as Id<"orders">,
            status: body.status,
        });
    }

    static async cancel(userId: string, id: string) {
        return await convex.mutation(api.order.cancel, {
            id: id as Id<"orders">,
            userId,
        });
    }
}
