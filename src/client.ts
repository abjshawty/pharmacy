import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.CONVEX_URL;

if (!convexUrl) {
    throw new Error("CONVEX_URL is not set");
}

export const convex = new ConvexHttpClient(convexUrl);
