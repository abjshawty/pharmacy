import { t } from "elysia";

export namespace Model {

    export const addItemBody = t.Object({
        pharmacyId: t.String(),
        inventoryId: t.String(),
        medicationId: t.String(),
        quantity: t.Number({ minimum: 1 }),
    });
    export type addItemBody = typeof addItemBody.static;

    export const updateItemBody = t.Object({
        quantity: t.Number({ minimum: 0 }),
    });
    export type updateItemBody = typeof updateItemBody.static;

    export const checkoutBody = t.Object({
        deliveryAddressId: t.String(),
        notes: t.Optional(t.String()),
    });
    export type checkoutBody = typeof checkoutBody.static;
}
