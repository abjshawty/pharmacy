import { Elysia, t } from 'elysia';
import { Service } from './service';
import { Model } from './model';

export const post = new Elysia({ prefix: '/post' })
    .post('/', ({ body: { title, content } }) => Service.create({ title, content }), {
        body: Model.createBody,
        response: {
            200: Model.createResponse,
            400: Model.createInvalid,
        },
    })
    .get('/', () => Service.list())
    .get('/:id', ({ params: { id } }) => Service.get(id), {
        params: t.Object({
            id: t.String(),
        }),
    })
    .put('/:id', ({ params: { id }, body: { title, content } }) => Service.update(id, { title, content }), {
        params: t.Object({
            id: t.String(),
        }),
        body: Model.updateBody,
    })
    .delete('/:id', ({ params: { id } }) => Service.delete(id), {
        params: t.Object({
            id: t.String(),
        }),
    });