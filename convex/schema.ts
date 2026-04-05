import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    posts: defineTable({
        // id: v.id('posts'),
        title: v.string(),
        content: v.string(),
    }),
});