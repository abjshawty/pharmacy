import { t } from 'elysia';

const operatingHour = t.Object({
    day: t.Number({ minimum: 0, maximum: 6 }),
    openTime: t.String(),
    closeTime: t.String(),
});

export namespace Model {

    export const createBody = t.Object({
        name: t.String(),
        address: t.String(),
        city: t.String(),
        country: t.String(),
        lat: t.Number(),
        lng: t.Number(),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String()),
        operatingHours: t.Array(operatingHour),
    });
    export type createBody = typeof createBody.static;

    export const updateBody = t.Object({
        name: t.Optional(t.String()),
        address: t.Optional(t.String()),
        city: t.Optional(t.String()),
        country: t.Optional(t.String()),
        lat: t.Optional(t.Number()),
        lng: t.Optional(t.Number()),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        operatingHours: t.Optional(t.Array(operatingHour)),
    });
    export type updateBody = typeof updateBody.static;

    export const listQuery = t.Object({
        city: t.Optional(t.String()),
        openOnly: t.Optional(t.BooleanString()),
    });
    export type listQuery = typeof listQuery.static;
}
