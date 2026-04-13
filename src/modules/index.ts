import { Elysia } from "elysia";
import openapi from "@elysiajs/openapi";
import { version } from "package.json";
import { authPlugin } from './auth';
import { user } from './user';
import { pharmacy } from './pharmacy';
import { medication } from './medication';
import { inventory } from './inventory';
import { geolocation } from './geolocation';
import { cart } from './cart';
import { order } from './order';

export default new Elysia({ prefix: 'v' + version.split(".")[0] })
    .use(openapi())
    .use(authPlugin)
    .use(user)
    .use(pharmacy)
    .use(medication)
    .use(inventory)
    .use(geolocation)
    .use(cart)
    .use(order)
    .get('/', (ctx) => ctx.redirect("/v" + version.split(".")[0] + "/openapi"));
