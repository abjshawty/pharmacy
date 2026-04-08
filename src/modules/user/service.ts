import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/src/client";
import type { Model } from "./model";

export abstract class Service {
    static async getProfile(authUserId: string) {
        return await convex.query(api.user.getProfile, { authUserId });
    }

    static async upsertProfile(authUserId: string, patch: Model.updateProfileBody) {
        const id = await convex.mutation(api.user.upsertProfile, { authUserId, ...patch });
        return await convex.query(api.user.getProfile, { authUserId }) ?? { _id: id, authUserId, ...patch };
    }

    static async listAddresses(userId: string) {
        return await convex.query(api.user.listAddresses, { userId });
    }

    static async addAddress(userId: string, body: Model.addAddressBody) {
        const id = await convex.mutation(api.user.addAddress, { userId, ...body });
        return id;
    }

    static async removeAddress(id: string, userId: string) {
        return await convex.mutation(api.user.removeAddress, {
            id: id as Id<"savedAddresses">,
            userId,
        });
    }
}
