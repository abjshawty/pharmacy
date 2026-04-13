import { Elysia, t } from 'elysia';
import { authGuard } from '@modules/auth';
import { Service } from './service';
import { Model } from './model';

export const order = new Elysia({ prefix: '/order' })
    .use(authGuard)
    // User: list their own orders (optionally filtered by status)
    .get('/', ({ user, query }) => Service.list(user!.id, query), {
        auth: true,
        query: Model.listQuery,
    })
    // User: get a single order with its items
    .get('/:id', ({ user, params: { id } }) => Service.get(user!.id, id), {
        auth: true,
        params: t.Object({ id: t.String() }),
    })
    // Pharmacy/admin: advance order through the fulfilment lifecycle
    .patch('/:id/status', ({ params: { id }, body }) => Service.updateStatus(id, body), {
        auth: true,
        params: t.Object({ id: t.String() }),
        body: Model.updateStatusBody,
    })
    // User: cancel order (only while pending or confirmed)
    .post('/:id/cancel', ({ user, params: { id } }) => Service.cancel(user!.id, id), {
        auth: true,
        params: t.Object({ id: t.String() }),
    });
