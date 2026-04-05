// Model define the data structure and validation for the request and response
import { t } from 'elysia';

export namespace Model {

    // Define a DTO for Elysia validation
    export const createBody = t.Object({
        title: t.String(),
        content: t.String(),
    });

    // Define it as TypeScript type
    export type createBody = typeof createBody.static;

    // Repeat for other models
    // Define a response model
    export const createInvalid = t.Literal('Invalid post data');
    export type createInvalid = typeof createInvalid.static;

    // Define a response model
    export const createResponse = t.Object({
        id: t.String(),
        title: t.String(),
        content: t.String(),
    });

    export const updateBody = t.Object({
        title: t.Optional(t.String()),
        content: t.Optional(t.String()),
    });

    export type createResponse = typeof createResponse.static;
    export type updateBody = typeof updateBody.static;
}
