import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

const db = new Database(process.env.AUTH_DATABASE_URL ?? "auth.db");

export const auth = betterAuth({
    database: db,
    emailAndPassword: {
        enabled: true,
    },
    basePath: "/v0/auth",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    trustedOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(","),
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
