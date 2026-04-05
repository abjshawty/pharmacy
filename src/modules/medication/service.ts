import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/src/client";
import type { Model } from "./model";

export abstract class Service {
    static async list(query: Model.listQuery) {
        if (query.q) {
            return await convex.query(api.medication.search, {
                q: query.q,
                category: query.category,
            });
        }
        return await convex.query(api.medication.list, {
            category: query.category,
            limit: query.limit,
        });
    }

    static async get(id: string) {
        return await convex.query(api.medication.get, {
            id: id as Id<"medications">,
        });
    }

    static async create(body: Model.createBody) {
        return await convex.mutation(api.medication.create, body);
    }

    static async update(id: string, body: Model.updateBody) {
        return await convex.mutation(api.medication.update, {
            id: id as Id<"medications">,
            ...body,
        });
    }
}
