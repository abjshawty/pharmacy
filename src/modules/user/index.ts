import { Elysia, t } from 'elysia';
import { authGuard } from '@modules/auth';
import { Service } from './service';
import { Model } from './model';

export const user = new Elysia({ prefix: '/user' })
    .use(authGuard)
    .get('/me', ({ user }) => Service.getProfile(user!.id), { auth: true })
    .put('/me', ({ user, body }) => Service.upsertProfile(user!.id, body), {
        auth: true,
        body: Model.updateProfileBody,
    })
    .get('/me/addresses', ({ user }) => Service.listAddresses(user!.id), { auth: true })
    .post('/me/addresses', ({ user, body }) => Service.addAddress(user!.id, body), {
        auth: true,
        body: Model.addAddressBody,
    })
    .delete('/me/addresses/:id', ({ user, params: { id } }) => Service.removeAddress(id, user!.id), {
        auth: true,
        params: t.Object({ id: t.String() }),
    });
