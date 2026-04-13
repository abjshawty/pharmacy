import { t } from "elysia";

export namespace Model {

    export const upsertBody = t.Object({
        pharmacyId: t.String(),
        medicationId: t.String(),
        quantity: t.Number({ minimum: 0 }),
        price: t.Number({ minimum: 0 }),
        currency: t.String(),
        isAvailable: t.Boolean(),
    });
    export type upsertBody = typeof upsertBody.static;

    export const updateBody = t.Object({
        quantity: t.Optional(t.Number({ minimum: 0 })),
        price: t.Optional(t.Number({ minimum: 0 })),
        currency: t.Optional(t.String()),
        isAvailable: t.Optional(t.Boolean()),
    });
    export type updateBody = typeof updateBody.static;

    export const listQuery = t.Object({
        pharmacyId: t.Optional(t.String()),
        medicationId: t.Optional(t.String()),
    });
    export type listQuery = typeof listQuery.static;
}
