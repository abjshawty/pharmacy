import { t } from 'elysia';

export namespace Model {

    export const updateProfileBody = t.Object({
        displayName: t.Optional(t.String()),
        phone: t.Optional(t.String()),
    });
    export type updateProfileBody = typeof updateProfileBody.static;

    export const profileResponse = t.Object({
        id: t.String(),
        authUserId: t.String(),
        displayName: t.Optional(t.String()),
        phone: t.Optional(t.String()),
    });
    export type profileResponse = typeof profileResponse.static;

    export const addAddressBody = t.Object({
        label: t.String(),
        street: t.String(),
        city: t.String(),
        country: t.String(),
        postalCode: t.Optional(t.String()),
        lat: t.Number(),
        lng: t.Number(),
        isDefault: t.Boolean(),
    });
    export type addAddressBody = typeof addAddressBody.static;

    export const addressResponse = t.Object({
        id: t.String(),
        userId: t.String(),
        label: t.String(),
        street: t.String(),
        city: t.String(),
        country: t.String(),
        postalCode: t.Optional(t.String()),
        lat: t.Number(),
        lng: t.Number(),
        isDefault: t.Boolean(),
    });
    export type addressResponse = typeof addressResponse.static;
}
