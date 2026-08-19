import type { Hono } from "hono";
import type { Bindings } from "../env";
import { articleKey } from "../keys";
import { apiError, CACHE, json } from "../lib/http";
import { getJson } from "../lib/kv";
import { messages } from "../copy";
import type { Article } from "../schema";

export function registerArticles(app: Hono<{ Bindings: Bindings }>) {
  app.get("/api/articles/:id", async (c) => {
    const id = c.req.param("id");
    const article = await getJson<Article>(c.env.NEWS_KV, articleKey(id));
    if (!article) {
      return apiError(c, 404, "not_found", messages.articleNotFound);
    }
    return json(c, article, 200, CACHE.article);
  });
}
