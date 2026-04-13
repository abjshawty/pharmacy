import { t } from "elysia";

export namespace Model {
    export const nearbyQuery = t.Object({
        lat: t.Numeric(),
        lng: t.Numeric(),
        radiusKm: t.Optional(t.Numeric()),
        openOnly: t.Optional(t.BooleanString()),
    });
    export type nearbyQuery = typeof nearbyQuery.static;
}
