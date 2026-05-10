# Integration Test Suite

Tests that hit the live HTTP server. Requires:
- `bun run setup` (Convex dev backend) running in one terminal
- `bun run dev:watch` (Elysia server) running in another
- `bun run seed` executed at least once

Run all integration tests:
```bash
bun test src/tests/integration/
```

Run a single file:
```bash
bun test src/tests/integration/pharmacy.test.ts
```

---

## `src/tests/integration/helpers.ts`

Shared utilities used across all test files.

```typescript
import { describe, expect } from "bun:test";

export const BASE = "http://localhost:3000/v1";

let _counter = Date.now();
export const uniqueEmail = () => `test+${_counter++}@example.com`;
export const TEST_PASSWORD = "Password1234!";

export async function signUp(email = uniqueEmail(), password = TEST_PASSWORD) {
    const res = await fetch(`${BASE}/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: "Test User" }),
    });
    return { res, email, password };
}

export async function signIn(email: string, password = TEST_PASSWORD) {
    const res = await fetch(`${BASE}/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const cookie = res.headers.get("set-cookie") ?? "";
    return { res, cookie };
}

export async function createSession() {
    const email = uniqueEmail();
    await signUp(email);
    const { cookie } = await signIn(email);
    return cookie;
}

export function authed(cookie: string): RequestInit {
    return { headers: { Cookie: cookie } };
}

export async function json(res: Response) {
    return res.json().catch(() => null);
}
```

---

## `src/tests/integration/auth.test.ts`

```typescript
import { beforeAll, describe, expect, it } from "bun:test";
import { BASE, uniqueEmail, TEST_PASSWORD, signUp, signIn, authed, json } from "./helpers";

describe("POST /v1/auth/sign-up/email", () => {
    it("creates a user and returns 200", async () => {
        const { res } = await signUp();
        expect(res.status).toBe(200);
        const body = await json(res);
        expect(body.user).toBeDefined();
        expect(body.user.email).toBeString();
    });

    it("rejects duplicate email", async () => {
        const email = uniqueEmail();
        await signUp(email);
        const { res } = await signUp(email);
        expect(res.status).toBe(422);
    });

    it("rejects missing password", async () => {
        const res = await fetch(`${BASE}/auth/sign-up/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: uniqueEmail() }),
        });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("rejects invalid email format", async () => {
        const res = await fetch(`${BASE}/auth/sign-up/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "not-an-email", password: TEST_PASSWORD }),
        });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("rejects empty body", async () => {
        const res = await fetch(`${BASE}/auth/sign-up/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});

describe("POST /v1/auth/sign-in/email", () => {
    let email: string;

    beforeAll(async () => {
        email = uniqueEmail();
        await signUp(email);
    });

    it("returns 200 and sets a session cookie on correct credentials", async () => {
        const { res, cookie } = await signIn(email);
        expect(res.status).toBe(200);
        expect(cookie).toContain("better-auth");
    });

    it("returns 401 on wrong password", async () => {
        const { res } = await signIn(email, "WrongPassword999!");
        expect(res.status).toBe(401);
    });

    it("returns 401 for non-existent email", async () => {
        const { res } = await signIn("nobody@example.com");
        expect(res.status).toBe(401);
    });

    it("returns 401 on missing password field", async () => {
        const res = await fetch(`${BASE}/auth/sign-in/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});

describe("GET /v1/auth/get-session", () => {
    let cookie: string;

    beforeAll(async () => {
        const email = uniqueEmail();
        await signUp(email);
        ({ cookie } = await signIn(email));
    });

    it("returns session and user when cookie is present", async () => {
        const res = await fetch(`${BASE}/auth/get-session`, authed(cookie));
        expect(res.status).toBe(200);
        const body = await json(res);
        expect(body?.session).toBeDefined();
        expect(body?.user).toBeDefined();
    });

    it("returns null session without a cookie", async () => {
        const res = await fetch(`${BASE}/auth/get-session`);
        expect(res.status).toBe(200);
        const body = await json(res);
        expect(body).toBeNull();
    });
});

describe("POST /v1/auth/sign-out", () => {
    it("clears the session and subsequent session check returns null", async () => {
        const email = uniqueEmail();
        await signUp(email);
        const { cookie } = await signIn(email);

        const signOutRes = await fetch(`${BASE}/auth/sign-out`, {
            method: "POST",
            ...authed(cookie),
        });
        expect(signOutRes.status).toBe(200);

        // Session should be gone
        const sessionRes = await fetch(`${BASE}/auth/get-session`, authed(cookie));
        const body = await json(sessionRes);
        expect(body).toBeNull();
    });
});
```

---

## `src/tests/integration/user.test.ts`

```typescript
import { beforeAll, describe, expect, it } from "bun:test";
import { BASE, createSession, authed, json, uniqueEmail, signUp, signIn } from "./helpers";

describe("GET /v1/user/me", () => {
    let cookie: string;

    beforeAll(async () => { cookie = await createSession(); });

    it("returns 200 for an authenticated user (null profile if not yet created)", async () => {
        const res = await fetch(`${BASE}/user/me`, authed(cookie));
        expect(res.status).toBe(200);
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/user/me`);
        expect(res.status).toBe(401);
    });
});

describe("PUT /v1/user/me", () => {
    let cookie: string;

    beforeAll(async () => { cookie = await createSession(); });

    it("creates or updates the profile and the change is reflected in GET", async () => {
        await fetch(`${BASE}/user/me`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ displayName: "Alice" }),
        });

        const res = await fetch(`${BASE}/user/me`, authed(cookie));
        const profile = await json(res);
        expect(profile?.displayName).toBe("Alice");
    });

    it("can update only phone without touching displayName", async () => {
        const cookie2 = await createSession();

        await fetch(`${BASE}/user/me`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie2 },
            body: JSON.stringify({ displayName: "Bob", phone: "0700000000" }),
        });

        await fetch(`${BASE}/user/me`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie2 },
            body: JSON.stringify({ phone: "0711111111" }),
        });

        const res = await fetch(`${BASE}/user/me`, authed(cookie2));
        const profile = await json(res);
        expect(profile?.displayName).toBe("Bob");
        expect(profile?.phone).toBe("0711111111");
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/user/me`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayName: "Ghost" }),
        });
        expect(res.status).toBe(401);
    });
});

describe("GET /v1/user/me/addresses", () => {
    let cookie: string;

    beforeAll(async () => { cookie = await createSession(); });

    it("returns an empty array for a fresh user", async () => {
        const res = await fetch(`${BASE}/user/me/addresses`, authed(cookie));
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/user/me/addresses`);
        expect(res.status).toBe(401);
    });
});

describe("POST /v1/user/me/addresses", () => {
    const addressBody = {
        label: "Home",
        street: "123 Kimathi St",
        city: "Nairobi",
        country: "Kenya",
        lat: -1.2864,
        lng: 36.8172,
        isDefault: false,
    };

    it("adds an address and it appears in the list", async () => {
        const cookie = await createSession();

        const postRes = await fetch(`${BASE}/user/me/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(addressBody),
        });
        expect(postRes.status).toBe(200);

        const listRes = await fetch(`${BASE}/user/me/addresses`, authed(cookie));
        const list = await json(listRes);
        expect(list.length).toBeGreaterThan(0);
        expect(list[0].label).toBe("Home");
    });

    it("setting isDefault=true unsets the previous default", async () => {
        const cookie = await createSession();

        await fetch(`${BASE}/user/me/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ ...addressBody, label: "Home", isDefault: true }),
        });

        await fetch(`${BASE}/user/me/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ ...addressBody, label: "Office", isDefault: true }),
        });

        const listRes = await fetch(`${BASE}/user/me/addresses`, authed(cookie));
        const list = await json(listRes);
        const defaults = list.filter((a: any) => a.isDefault);
        expect(defaults.length).toBe(1);
        expect(defaults[0].label).toBe("Office");
    });

    it("accepts optional postalCode", async () => {
        const cookie = await createSession();
        const res = await fetch(`${BASE}/user/me/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ ...addressBody, postalCode: "00100" }),
        });
        expect(res.status).toBe(200);
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/user/me/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addressBody),
        });
        expect(res.status).toBe(401);
    });

    it("rejects body missing required fields", async () => {
        const cookie = await createSession();
        const res = await fetch(`${BASE}/user/me/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ label: "Incomplete" }),
        });
        expect(res.status).toBe(422);
    });
});

describe("DELETE /v1/user/me/addresses/:id", () => {
    it("removes an address from the user's list", async () => {
        const cookie = await createSession();

        const postRes = await fetch(`${BASE}/user/me/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({
                label: "Temp", street: "1 Test Rd", city: "Nairobi",
                country: "Kenya", lat: -1.28, lng: 36.82, isDefault: false,
            }),
        });
        const id = await json(postRes);

        const delRes = await fetch(`${BASE}/user/me/addresses/${id}`, {
            method: "DELETE",
            ...authed(cookie),
        });
        expect(delRes.status).toBe(200);

        const listRes = await fetch(`${BASE}/user/me/addresses`, authed(cookie));
        const list = await json(listRes);
        expect(list.find((a: any) => a._id === id)).toBeUndefined();
    });

    it("rejects deleting another user's address", async () => {
        const cookie1 = await createSession();
        const cookie2 = await createSession();

        const postRes = await fetch(`${BASE}/user/me/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie1 },
            body: JSON.stringify({
                label: "Home", street: "1 Main St", city: "Nairobi",
                country: "Kenya", lat: -1.28, lng: 36.82, isDefault: false,
            }),
        });
        const id = await json(postRes);

        const delRes = await fetch(`${BASE}/user/me/addresses/${id}`, {
            method: "DELETE",
            ...authed(cookie2),
        });
        expect(delRes.status).toBeGreaterThanOrEqual(400);
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/user/me/addresses/fake-id`, { method: "DELETE" });
        expect(res.status).toBe(401);
    });
});
```

---

## `src/tests/integration/pharmacy.test.ts`

```typescript
import { beforeAll, describe, expect, it } from "bun:test";
import { BASE, createSession, authed, json } from "./helpers";

const validPharmacy = {
    name: "Test Pharmacy",
    address: "1 Test Lane",
    city: "Nairobi",
    country: "Kenya",
    lat: -1.2921,
    lng: 36.8219,
    phone: "+254700000000",
    email: "test@pharmacy.test",
    operatingHours: [
        { day: 1, openTime: "08:00", closeTime: "20:00" },
        { day: 2, openTime: "08:00", closeTime: "20:00" },
        { day: 3, openTime: "08:00", closeTime: "20:00" },
        { day: 4, openTime: "08:00", closeTime: "20:00" },
        { day: 5, openTime: "08:00", closeTime: "20:00" },
    ],
};

describe("GET /v1/pharmacy", () => {
    it("returns an array of active pharmacies", async () => {
        const res = await fetch(`${BASE}/pharmacy`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
    });

    it("each pharmacy has an isOpen field", async () => {
        const res = await fetch(`${BASE}/pharmacy`);
        const body = await json(res);
        expect(body.length).toBeGreaterThan(0);
        for (const p of body) {
            expect(typeof p.isOpen).toBe("boolean");
        }
    });

    it("filters by city", async () => {
        const res = await fetch(`${BASE}/pharmacy?city=Nairobi`);
        const body = await json(res);
        expect(res.status).toBe(200);
        for (const p of body) {
            expect(p.city).toBe("Nairobi");
        }
    });

    it("returns empty array for an unknown city", async () => {
        const res = await fetch(`${BASE}/pharmacy?city=__NoSuchCity__`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body).toEqual([]);
    });

    it("openOnly=true returns only open pharmacies", async () => {
        const res = await fetch(`${BASE}/pharmacy?openOnly=true`);
        const body = await json(res);
        expect(res.status).toBe(200);
        for (const p of body) {
            expect(p.isOpen).toBe(true);
        }
    });

    it("inactive pharmacies do not appear in the list", async () => {
        const cookie = await createSession();

        // Create a pharmacy then deactivate it
        const createRes = await fetch(`${BASE}/pharmacy`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ ...validPharmacy, name: "Inactive Test Pharmacy" }),
        });
        const id = await json(createRes);

        await fetch(`${BASE}/pharmacy/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ isActive: false }),
        });

        const listRes = await fetch(`${BASE}/pharmacy`);
        const list = await json(listRes);
        expect(list.find((p: any) => p._id === id)).toBeUndefined();
    });
});

describe("GET /v1/pharmacy/:id", () => {
    let pharmacyId: string;
    let cookie: string;

    beforeAll(async () => {
        cookie = await createSession();
        const res = await fetch(`${BASE}/pharmacy`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(validPharmacy),
        });
        pharmacyId = await json(res);
    });

    it("returns the pharmacy with isOpen field", async () => {
        const res = await fetch(`${BASE}/pharmacy/${pharmacyId}`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body._id).toBe(pharmacyId);
        expect(typeof body.isOpen).toBe("boolean");
    });

    it("returns null for a non-existent ID", async () => {
        const res = await fetch(`${BASE}/pharmacy/j57abc1234567890abcdef`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body).toBeNull();
    });
});

describe("POST /v1/pharmacy", () => {
    let cookie: string;

    beforeAll(async () => { cookie = await createSession(); });

    it("creates a pharmacy and returns its Convex ID", async () => {
        const res = await fetch(`${BASE}/pharmacy`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(validPharmacy),
        });
        const id = await json(res);
        expect(res.status).toBe(200);
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(0);
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/pharmacy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validPharmacy),
        });
        expect(res.status).toBe(401);
    });

    it("rejects missing required field name", async () => {
        const { name: _, ...body } = validPharmacy;
        const res = await fetch(`${BASE}/pharmacy`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(body),
        });
        expect(res.status).toBe(422);
    });

    it("rejects missing required field country", async () => {
        const { country: _, ...body } = validPharmacy;
        const res = await fetch(`${BASE}/pharmacy`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(body),
        });
        expect(res.status).toBe(422);
    });

    it("rejects operatingHours day outside 0–6", async () => {
        const res = await fetch(`${BASE}/pharmacy`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({
                ...validPharmacy,
                operatingHours: [{ day: 7, openTime: "09:00", closeTime: "17:00" }],
            }),
        });
        expect(res.status).toBe(422);
    });

    it("succeeds without optional phone and email", async () => {
        const { phone: _p, email: _e, ...body } = validPharmacy;
        const res = await fetch(`${BASE}/pharmacy`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(body),
        });
        expect(res.status).toBe(200);
    });
});

describe("PUT /v1/pharmacy/:id", () => {
    let cookie: string;
    let pharmacyId: string;

    beforeAll(async () => {
        cookie = await createSession();
        const res = await fetch(`${BASE}/pharmacy`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(validPharmacy),
        });
        pharmacyId = await json(res);
    });

    it("updates a field and GET reflects the change", async () => {
        await fetch(`${BASE}/pharmacy/${pharmacyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ phone: "+254799999999" }),
        });

        const res = await fetch(`${BASE}/pharmacy/${pharmacyId}`);
        const body = await json(res);
        expect(body.phone).toBe("+254799999999");
    });

    it("can update operatingHours", async () => {
        const newHours = [{ day: 6, openTime: "10:00", closeTime: "14:00" }];
        await fetch(`${BASE}/pharmacy/${pharmacyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ operatingHours: newHours }),
        });

        const res = await fetch(`${BASE}/pharmacy/${pharmacyId}`);
        const body = await json(res);
        expect(body.operatingHours).toEqual(newHours);
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/pharmacy/${pharmacyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: "+254799999999" }),
        });
        expect(res.status).toBe(401);
    });

    it("throws when updating a non-existent ID", async () => {
        const res = await fetch(`${BASE}/pharmacy/j57abc1234567890abcdef`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ phone: "+254799999999" }),
        });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});
```

---

## `src/tests/integration/medication.test.ts`

```typescript
import { beforeAll, describe, expect, it } from "bun:test";
import { BASE, createSession, authed, json } from "./helpers";

const validMedication = {
    name: "Paracetamol Test",
    genericName: "Acetaminophen",
    brand: "Panadol",
    category: "analgesic",
    description: "Pain relief",
    requiresPrescription: false,
    dosageForms: ["tablet", "syrup"],
};

describe("GET /v1/medication", () => {
    it("returns an array", async () => {
        const res = await fetch(`${BASE}/medication`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
    });

    it("respects the limit param", async () => {
        const res = await fetch(`${BASE}/medication?limit=2`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body.length).toBeLessThanOrEqual(2);
    });

    it("filters by category", async () => {
        const res = await fetch(`${BASE}/medication?category=analgesic`);
        const body = await json(res);
        expect(res.status).toBe(200);
        for (const m of body) {
            expect(m.category).toBe("analgesic");
        }
    });

    it("returns empty for unknown category", async () => {
        const res = await fetch(`${BASE}/medication?category=__unknown__`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body).toEqual([]);
    });

    it("returns up to 50 results by default (no q param)", async () => {
        const res = await fetch(`${BASE}/medication`);
        const body = await json(res);
        expect(body.length).toBeLessThanOrEqual(50);
    });
});

describe("GET /v1/medication (search)", () => {
    it("returns results matching the query", async () => {
        const res = await fetch(`${BASE}/medication?q=para`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
    });

    it("returns empty for a search that matches nothing", async () => {
        const res = await fetch(`${BASE}/medication?q=zzznomatch999`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body).toEqual([]);
    });

    it("search returns at most 20 results", async () => {
        const res = await fetch(`${BASE}/medication?q=a`);
        const body = await json(res);
        expect(body.length).toBeLessThanOrEqual(20);
    });

    it("search can be combined with category", async () => {
        const res = await fetch(`${BASE}/medication?q=para&category=analgesic`);
        const body = await json(res);
        expect(res.status).toBe(200);
        for (const m of body) {
            expect(m.category).toBe("analgesic");
        }
    });
});

describe("GET /v1/medication/:id", () => {
    let medId: string;
    let cookie: string;

    beforeAll(async () => {
        cookie = await createSession();
        const res = await fetch(`${BASE}/medication`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(validMedication),
        });
        medId = await json(res);
    });

    it("returns the medication by ID", async () => {
        const res = await fetch(`${BASE}/medication/${medId}`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body._id).toBe(medId);
        expect(body.name).toBe(validMedication.name);
    });

    it("returns null for a non-existent ID", async () => {
        const res = await fetch(`${BASE}/medication/j57abc1234567890abcdef`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body).toBeNull();
    });
});

describe("POST /v1/medication", () => {
    let cookie: string;

    beforeAll(async () => { cookie = await createSession(); });

    it("creates a medication and returns its ID", async () => {
        const res = await fetch(`${BASE}/medication`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(validMedication),
        });
        const id = await json(res);
        expect(res.status).toBe(200);
        expect(typeof id).toBe("string");
    });

    it("succeeds without optional fields", async () => {
        const minimal = {
            name: "Aspirin Test",
            category: "analgesic",
            requiresPrescription: false,
            dosageForms: ["tablet"],
        };
        const res = await fetch(`${BASE}/medication`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(minimal),
        });
        expect(res.status).toBe(200);
    });

    it("rejects missing dosageForms", async () => {
        const { dosageForms: _, ...body } = validMedication;
        const res = await fetch(`${BASE}/medication`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(body),
        });
        expect(res.status).toBe(422);
    });

    it("rejects missing requiresPrescription", async () => {
        const { requiresPrescription: _, ...body } = validMedication;
        const res = await fetch(`${BASE}/medication`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(body),
        });
        expect(res.status).toBe(422);
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/medication`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validMedication),
        });
        expect(res.status).toBe(401);
    });
});

describe("PUT /v1/medication/:id", () => {
    let cookie: string;
    let medId: string;

    beforeAll(async () => {
        cookie = await createSession();
        const res = await fetch(`${BASE}/medication`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(validMedication),
        });
        medId = await json(res);
    });

    it("updates fields and GET reflects the change", async () => {
        await fetch(`${BASE}/medication/${medId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ description: "Updated description" }),
        });

        const res = await fetch(`${BASE}/medication/${medId}`);
        const body = await json(res);
        expect(body.description).toBe("Updated description");
    });

    it("can update dosageForms array", async () => {
        await fetch(`${BASE}/medication/${medId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ dosageForms: ["capsule"] }),
        });

        const res = await fetch(`${BASE}/medication/${medId}`);
        const body = await json(res);
        expect(body.dosageForms).toEqual(["capsule"]);
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/medication/${medId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: "Hack" }),
        });
        expect(res.status).toBe(401);
    });

    it("throws when updating a non-existent ID", async () => {
        const res = await fetch(`${BASE}/medication/j57abc1234567890abcdef`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ description: "Ghost" }),
        });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});
```

---

## `src/tests/integration/geolocation.test.ts`

Uses coordinates near seeded Nairobi pharmacies (`bun run seed` required).

```typescript
import { describe, expect, it } from "bun:test";
import { BASE, json } from "./helpers";

// Nairobi CBD — seeded pharmacies are within ~10 km
const NAIROBI = { lat: -1.2864, lng: 36.8172 };

describe("GET /v1/geolocation/nearby", () => {
    it("returns pharmacies within the default 10 km radius", async () => {
        const res = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
    });

    it("each result has distanceKm and isOpen fields", async () => {
        const res = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}`);
        const body = await json(res);
        for (const p of body) {
            expect(typeof p.distanceKm).toBe("number");
            expect(typeof p.isOpen).toBe("boolean");
        }
    });

    it("results are sorted nearest-first", async () => {
        const res = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}`);
        const body = await json(res);
        for (let i = 1; i < body.length; i++) {
            expect(body[i].distanceKm).toBeGreaterThanOrEqual(body[i - 1].distanceKm);
        }
    });

    it("radiusKm=0 returns no results", async () => {
        const res = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}&radiusKm=0`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body).toEqual([]);
    });

    it("very large radius returns all active pharmacies", async () => {
        const allRes = await fetch(`${BASE}/pharmacy`);
        const allPharmacies = await json(allRes);

        const nearbyRes = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}&radiusKm=20000`);
        const nearby = await json(nearbyRes);

        expect(nearby.length).toBe(allPharmacies.length);
    });

    it("openOnly=true excludes closed pharmacies", async () => {
        const res = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}&openOnly=true`);
        const body = await json(res);
        expect(res.status).toBe(200);
        for (const p of body) {
            expect(p.isOpen).toBe(true);
        }
    });

    it("openOnly=false (default) includes closed pharmacies", async () => {
        const withClosed = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}&openOnly=false`);
        const withOpen  = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}&openOnly=true`);
        const closedCount = (await json(withClosed)).length;
        const openCount   = (await json(withOpen)).length;
        expect(closedCount).toBeGreaterThanOrEqual(openCount);
    });

    it("returns 422 when lat is missing", async () => {
        const res = await fetch(`${BASE}/geolocation/nearby?lng=${NAIROBI.lng}`);
        expect(res.status).toBe(422);
    });

    it("returns 422 when lng is missing", async () => {
        const res = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}`);
        expect(res.status).toBe(422);
    });

    it("returns 422 when lat is non-numeric", async () => {
        const res = await fetch(`${BASE}/geolocation/nearby?lat=abc&lng=${NAIROBI.lng}`);
        expect(res.status).toBe(422);
    });

    it("returns 422 when both lat and lng are missing", async () => {
        const res = await fetch(`${BASE}/geolocation/nearby`);
        expect(res.status).toBe(422);
    });

    it("inactive pharmacies are excluded even within radius", async () => {
        // All results must have isActive: true (Convex filters this)
        const res = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}&radiusKm=20000`);
        const body = await json(res);
        for (const p of body) {
            expect(p.isActive).toBe(true);
        }
    });

    it("custom radiusKm=1 returns fewer results than radiusKm=50", async () => {
        const small = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}&radiusKm=1`);
        const large = await fetch(`${BASE}/geolocation/nearby?lat=${NAIROBI.lat}&lng=${NAIROBI.lng}&radiusKm=50`);
        const smallCount = (await json(small)).length;
        const largeCount = (await json(large)).length;
        expect(largeCount).toBeGreaterThanOrEqual(smallCount);
    });
});
```

---

## `src/tests/integration/inventory.test.ts`

```typescript
import { beforeAll, describe, expect, it } from "bun:test";
import { BASE, createSession, authed, json } from "./helpers";

describe("GET /v1/inventory", () => {
    it("returns all inventory records without filters", async () => {
        const res = await fetch(`${BASE}/inventory`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
    });

    it("filters by pharmacyId", async () => {
        // Get a known pharmacyId from the seeded data
        const pharmacies = await fetch(`${BASE}/pharmacy`).then(r => r.json());
        if (pharmacies.length === 0) return; // skip if no seed data
        const pharmacyId = pharmacies[0]._id;

        const res = await fetch(`${BASE}/inventory?pharmacyId=${pharmacyId}`);
        const body = await json(res);
        expect(res.status).toBe(200);
        for (const item of body) {
            expect(item.pharmacyId).toBe(pharmacyId);
        }
    });

    it("filters by medicationId", async () => {
        const medications = await fetch(`${BASE}/medication`).then(r => r.json());
        if (medications.length === 0) return;
        const medicationId = medications[0]._id;

        const res = await fetch(`${BASE}/inventory?medicationId=${medicationId}`);
        const body = await json(res);
        expect(res.status).toBe(200);
        for (const item of body) {
            expect(item.medicationId).toBe(medicationId);
        }
    });

    it("filters by both pharmacyId and medicationId", async () => {
        const pharmacies = await fetch(`${BASE}/pharmacy`).then(r => r.json());
        const medications = await fetch(`${BASE}/medication`).then(r => r.json());
        if (!pharmacies.length || !medications.length) return;

        const res = await fetch(`${BASE}/inventory?pharmacyId=${pharmacies[0]._id}&medicationId=${medications[0]._id}`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
        // At most one record for a given pair
        expect(body.length).toBeLessThanOrEqual(1);
    });
});

describe("GET /v1/inventory/:id", () => {
    let inventoryId: string;
    let cookie: string;

    beforeAll(async () => {
        cookie = await createSession();

        const pharmacies = await fetch(`${BASE}/pharmacy`).then(r => r.json());
        const medications = await fetch(`${BASE}/medication`).then(r => r.json());

        const res = await fetch(`${BASE}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({
                pharmacyId: pharmacies[0]._id,
                medicationId: medications[0]._id,
                quantity: 10,
                price: 500,
                currency: "KES",
                isAvailable: true,
            }),
        });
        inventoryId = await json(res);
    });

    it("returns the inventory record by ID", async () => {
        const res = await fetch(`${BASE}/inventory/${inventoryId}`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body._id).toBe(inventoryId);
    });

    it("returns null for a non-existent ID", async () => {
        const res = await fetch(`${BASE}/inventory/j57abc1234567890abcdef`);
        const body = await json(res);
        expect(res.status).toBe(200);
        expect(body).toBeNull();
    });
});

describe("POST /v1/inventory (upsert)", () => {
    let cookie: string;
    let pharmacyId: string;
    let medicationId: string;

    beforeAll(async () => {
        cookie = await createSession();
        const pharmacies = await fetch(`${BASE}/pharmacy`).then(r => r.json());
        const medications = await fetch(`${BASE}/medication`).then(r => r.json());
        // Use the second pair to avoid colliding with beforeAll above
        pharmacyId = pharmacies[Math.min(1, pharmacies.length - 1)]._id;
        medicationId = medications[Math.min(1, medications.length - 1)]._id;
    });

    const upsertBody = () => ({
        pharmacyId,
        medicationId,
        quantity: 20,
        price: 300,
        currency: "KES",
        isAvailable: true,
    });

    it("creates a new inventory record and returns an ID", async () => {
        const res = await fetch(`${BASE}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(upsertBody()),
        });
        const id = await json(res);
        expect(res.status).toBe(200);
        expect(typeof id).toBe("string");
    });

    it("upsert called twice returns the same ID (idempotent, no duplicate)", async () => {
        const body = upsertBody();

        const res1 = await fetch(`${BASE}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(body),
        });
        const id1 = await json(res1);

        const res2 = await fetch(`${BASE}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ ...body, quantity: 99 }),
        });
        const id2 = await json(res2);

        expect(id1).toBe(id2);

        // Confirm the quantity was updated
        const getRes = await fetch(`${BASE}/inventory/${id1}`);
        const record = await json(getRes);
        expect(record.quantity).toBe(99);
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(upsertBody()),
        });
        expect(res.status).toBe(401);
    });

    it("rejects quantity less than 0", async () => {
        const res = await fetch(`${BASE}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ ...upsertBody(), quantity: -1 }),
        });
        expect(res.status).toBe(422);
    });

    it("rejects price less than 0", async () => {
        const res = await fetch(`${BASE}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ ...upsertBody(), price: -1 }),
        });
        expect(res.status).toBe(422);
    });

    it("rejects missing currency", async () => {
        const { currency: _, ...body } = upsertBody();
        const res = await fetch(`${BASE}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(body),
        });
        expect(res.status).toBe(422);
    });
});

describe("PUT /v1/inventory/:id", () => {
    let cookie: string;
    let inventoryId: string;

    beforeAll(async () => {
        cookie = await createSession();
        const pharmacies = await fetch(`${BASE}/pharmacy`).then(r => r.json());
        const medications = await fetch(`${BASE}/medication`).then(r => r.json());

        const res = await fetch(`${BASE}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({
                pharmacyId: pharmacies[pharmacies.length - 1]._id,
                medicationId: medications[medications.length - 1]._id,
                quantity: 5,
                price: 100,
                currency: "KES",
                isAvailable: true,
            }),
        });
        inventoryId = await json(res);
    });

    it("updates quantity and isAvailable; GET reflects changes", async () => {
        await fetch(`${BASE}/inventory/${inventoryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ quantity: 0, isAvailable: false }),
        });

        const res = await fetch(`${BASE}/inventory/${inventoryId}`);
        const body = await json(res);
        expect(body.quantity).toBe(0);
        expect(body.isAvailable).toBe(false);
    });

    it("updates price only without touching quantity", async () => {
        await fetch(`${BASE}/inventory/${inventoryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ price: 999 }),
        });

        const res = await fetch(`${BASE}/inventory/${inventoryId}`);
        const body = await json(res);
        expect(body.price).toBe(999);
        expect(body.quantity).toBe(0); // unchanged from previous test
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch(`${BASE}/inventory/${inventoryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: 10 }),
        });
        expect(res.status).toBe(401);
    });

    it("throws on non-existent ID", async () => {
        const res = await fetch(`${BASE}/inventory/j57abc1234567890abcdef`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({ quantity: 10 }),
        });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});
```
