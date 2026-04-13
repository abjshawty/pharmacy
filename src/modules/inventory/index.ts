import { Elysia, t } from 'elysia';
import { authGuard } from '@modules/auth';
import { Service } from './service';
import { Model } from './model';

export const inventory = new Elysia({ prefix: '/inventory' })
    .use(authGuard)
    // Public
    .get('/', ({ query }) => Service.list(query), {
        query: Model.listQuery,
    })
    .get('/:id', ({ params: { id } }) => Service.get(id), {
        params: t.Object({ id: t.String() }),
    })
    // Authenticated (admin gate deferred to Phase 3+)
    .post('/', ({ body }) => Service.upsert(body), {
        auth: true,
        body: Model.upsertBody,
    })
    .put('/:id', ({ params: { id }, body }) => Service.update(id, body), {
        auth: true,
        params: t.Object({ id: t.String() }),
        body: Model.updateBody,
    });
