import { Elysia } from "elysia";
import openapi from "@elysiajs/openapi";
import { version } from "package.json";
import { authPlugin } from './auth';
import { user } from './user';
import { pharmacy } from './pharmacy';
import { medication } from './medication';

export default new Elysia({ prefix: 'v' + version.split(".")[0] })
    .use(openapi())
    .use(authPlugin)
    .use(user)
    .use(pharmacy)
    .use(medication)
    .get('/', (ctx) => ctx.redirect("/openapi"));
