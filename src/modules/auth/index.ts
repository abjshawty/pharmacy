import { Elysia } from "elysia";
import { auth } from "./auth";

// Mount Better Auth's HTTP handler — handles all /api/auth/* routes
export const authPlugin = new Elysia({ name: "auth" })
    .mount(auth.handler);

// Session guard — use .use(authGuard) on any plugin/route group that requires auth.
// Injects { user, session } into context; returns 401 if no valid session.
export const authGuard = new Elysia({ name: "auth-guard" })
    .macro({
        auth(enabled: boolean) {
            if (!enabled) return;
            return {
                resolve: async ({ status, request: { headers } }) => {
                    const session = await auth.api.getSession({ headers });
                    if (!session) return status(401);
                    return {
                        user: session.user,
                        session: session.session,
                    };
                },
            };
        },
    });

export { auth };
