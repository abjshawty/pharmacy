import { mutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        title: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("posts", {
            title: args.title,
            content: args.content,
        });
    }
});

export const getPosts = query({
    args: {
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const posts = args.title
            ? await ctx.db.query("posts").filter(q => q.eq(q.field("title"), args.title)).take(10)
            : await ctx.db.query("posts").take(10);
        return posts;
    }
});

export const getPost = query({
    args: {
        id: v.id("posts"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("posts").filter(q => q.eq(q.field("_id"), args.id)).take(1);
    }
});

export const updatePost = mutation({
    args: {
        id: v.id("posts"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const patch: { title?: string; content?: string; } = {};

        if (args.title !== undefined) {
            patch.title = args.title;
        }

        if (args.content !== undefined) {
            patch.content = args.content;
        }

        return await ctx.db.patch("posts", args.id, patch);
    }
});

export const deletePost = mutation({
    args: {
        id: v.id("posts"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.delete("posts", args.id);
    }
});