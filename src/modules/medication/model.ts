import { t } from 'elysia';

export namespace Model {

    export const createBody = t.Object({
        name: t.String(),
        genericName: t.Optional(t.String()),
        brand: t.Optional(t.String()),
        category: t.String(),
        description: t.Optional(t.String()),
        requiresPrescription: t.Boolean(),
        dosageForms: t.Array(t.String()),
    });
    export type createBody = typeof createBody.static;

    export const updateBody = t.Object({
        name: t.Optional(t.String()),
        genericName: t.Optional(t.String()),
        brand: t.Optional(t.String()),
        category: t.Optional(t.String()),
        description: t.Optional(t.String()),
        requiresPrescription: t.Optional(t.Boolean()),
        dosageForms: t.Optional(t.Array(t.String())),
    });
    export type updateBody = typeof updateBody.static;

    export const listQuery = t.Object({
        q: t.Optional(t.String()),
        category: t.Optional(t.String()),
        limit: t.Optional(t.Number()),
    });
    export type listQuery = typeof listQuery.static;
}
