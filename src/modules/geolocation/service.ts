import { api } from "@/convex/_generated/api";
import { convex } from "@/src/client";
import type { Model } from "./model";

export abstract class Service {
    static async nearby(query: Model.nearbyQuery) {
        return await convex.query(api.geolocation.nearby, {
            lat: Number(query.lat),
            lng: Number(query.lng),
            radiusKm: query.radiusKm !== undefined ? Number(query.radiusKm) : undefined,
            openOnly: query.openOnly ?? false,
        });
    }
}
