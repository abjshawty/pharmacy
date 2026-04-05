import { Elysia } from "elysia";
import { post } from './post';
import openapi from "@elysiajs/openapi";
import { version } from "package.json";
// import { authPlugin } from './auth'; // Optional: uncomment to enable auth

export default new Elysia({ prefix: 'v' + version.split(".")[0] })
    .use(openapi())
    // .use(authPlugin)  // Optional: exposes /v0/auth/* endpoints
    .use(post)
    .get('/', (ctx) => ctx.redirect("/openapi"));
