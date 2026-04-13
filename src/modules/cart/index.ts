import { Elysia, t } from 'elysia';
import { authGuard } from '@modules/auth';
import { Service } from './service';
import { Model } from './model';

export const cart = new Elysia({ prefix: '/cart' })
    .use(authGuard)
    // All cart routes require authentication
    .get('/', ({ user }) => Service.getActive(user!.id), {
        auth: true,
    })
    .post('/items', ({ user, body }) => Service.addItem(user!.id, body), {
        auth: true,
        body: Model.addItemBody,
    })
    .put('/items/:itemId', ({ user, params: { itemId }, body }) =>
        Service.updateItem(user!.id, itemId, body), {
        auth: true,
        params: t.Object({ itemId: t.String() }),
        body: Model.updateItemBody,
    })
    .delete('/items/:itemId', ({ user, params: { itemId } }) =>
        Service.removeItem(user!.id, itemId), {
        auth: true,
        params: t.Object({ itemId: t.String() }),
    })
    .post('/checkout', ({ user, body }) => Service.checkout(user!.id, body), {
        auth: true,
        body: Model.checkoutBody,
    });
