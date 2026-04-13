import { Elysia } from 'elysia';
import { Service } from './service';
import { Model } from './model';

export const geolocation = new Elysia({ prefix: '/geolocation' })
    .get('/nearby', ({ query }) => Service.nearby(query), {
        query: Model.nearbyQuery,
    });
