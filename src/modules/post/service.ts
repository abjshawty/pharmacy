import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { status } from "elysia";
import { convex } from "@/src/client";
import { Model } from "./model";

export abstract class Service {
    static async create ({ title, content }: Model.createBody): Promise<Model.createResponse> {
        if (!title || !content) {
            throw status(400, 'Invalid post data');
        }
        const posts = await convex.mutation(api.post.create, { title, content });
        return {
            id: posts,
            title,
            content,
        };
    }

    static async list () {
        return await convex.query(api.post.getPosts, {});
    }
    static async get (id: string) {
        return await convex.query(api.post.getPost, { id: id as Id<"posts"> });
    }
    static async update (id: string, { title, content }: Model.updateBody) {
        return await convex.mutation(api.post.updatePost, { id: id as Id<"posts">, title, content });
    }
    static async delete (id: string) {
        return await convex.mutation(api.post.deletePost, { id: id as Id<"posts"> });
    }
}