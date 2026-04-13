import { t } from "elysia";

const ORDER_STATUSES = [
    "pending",
    "confirmed",
    "preparing",
    "dispatched",
    "delivered",
    "cancelled",
] as const;

export namespace Model {

    export const listQuery = t.Object({
        status: t.Optional(t.Union(ORDER_STATUSES.map(s => t.Literal(s)) as [
            ReturnType<typeof t.Literal>,
            ...ReturnType<typeof t.Literal>[]
        ])),
    });
    export type listQuery = typeof listQuery.static;

    // Only the pharmacy/admin can advance the status forward
    export const updateStatusBody = t.Object({
        status: t.Union([
            t.Literal("confirmed"),
            t.Literal("preparing"),
            t.Literal("dispatched"),
            t.Literal("delivered"),
        ]),
    });
    export type updateStatusBody = typeof updateStatusBody.static;
}
