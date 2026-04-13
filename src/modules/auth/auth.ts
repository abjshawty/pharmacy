import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { BunSqliteDialect } from "kysely-bun-worker/normal";
import { Kysely } from "kysely";

const kysely = new Kysely({
    dialect: new BunSqliteDialect({
        url: process.env.AUTH_DATABASE_URL ?? "auth.db",
    }),
});

export const auth = betterAuth({
    database: kyselyAdapter(kysely),
    emailAndPassword: {
        enabled: true,
    },
    basePath: "/v1/auth",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    trustedOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(","),
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
