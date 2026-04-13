import { Elysia } from "elysia";
import { auth } from "./auth";

// Mount Better Auth's HTTP handler — handles all /api/auth/* routes
export const authPlugin = new Elysia({ name: "auth" })
    .mount(auth.handler);

// Session guard — use .use(authGuard) on any plugin/route group that requires auth.
// Always derives { user, session } from the request (possibly undefined).
// The `auth: true` macro option adds a beforeHandle that returns 401 if no session.
// Routes with `auth: true` can safely use user! — beforeHandle guarantees non-null.
export const authGuard = new Elysia({ name: "auth-guard" })
    .derive({ as: 'scoped' }, async ({ request: { headers } }) => {
        const session = await auth.api.getSession({ headers });
        return {
            user: session?.user,
            session: session?.session,
        };
    })
    .macro({
        auth(enabled: boolean) {
            if (!enabled) return;
            return {
                beforeHandle({ user, status }) {
                    if (!user) return status(401);
                },
            };
        },
    })
    .as('scoped');

export { auth };
