import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/src/client";
import type { Model } from "./model";

type OperatingHour = { day: number; openTime: string; closeTime: string };

function computeIsOpen(operatingHours: OperatingHour[]): boolean {
    const now = new Date();
    const day = now.getDay();
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    const current = `${hh}:${mm}`;
    const slot = operatingHours.find(h => h.day === day);
    if (!slot) return false;
    return current >= slot.openTime && current <= slot.closeTime;
}

export abstract class Service {
    static async list(query: Model.listQuery) {
        const pharmacies = await convex.query(api.pharmacy.list, {
            city: query.city,
        });
        const withStatus = pharmacies.map(p => ({
            ...p,
            isOpen: p.isActive ? computeIsOpen(p.operatingHours) : false,
        }));
        if (query.openOnly) return withStatus.filter(p => p.isOpen);
        return withStatus;
    }

    static async get(id: string) {
        const pharmacy = await convex.query(api.pharmacy.get, {
            id: id as Id<"pharmacies">,
        });
        if (!pharmacy) return null;
        return {
            ...pharmacy,
            isOpen: pharmacy.isActive ? computeIsOpen(pharmacy.operatingHours) : false,
        };
    }

    static async create(body: Model.createBody) {
        const id = await convex.mutation(api.pharmacy.create, body);
        return id;
    }

    static async update(id: string, body: Model.updateBody) {
        return await convex.mutation(api.pharmacy.update, {
            id: id as Id<"pharmacies">,
            ...body,
        });
    }
}
