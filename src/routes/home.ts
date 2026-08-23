import type { Hono } from "hono";
import type { Bindings } from "../env";
import { KEYS } from "../keys";
import { CACHE, json } from "../lib/http";
import { getJson } from "../lib/kv";
import { parseCategories, type HomeFeed } from "../schema";

export function registerHome(app: Hono<{ Bindings: Bindings }>) {
  app.get("/api/home", async (c) => {
    const feed = (await getJson<HomeFeed>(c.env.NEWS_KV, KEYS.home)) ?? {
      schemaVersion: 1 as const,
      updatedAt: new Date().toISOString(),
      days: [],
    };
    const categories = parseCategories(c.req.query("category"));
    if (categories.length) {
      const allowed = new Set(categories);
      const days = feed.days
        .map((day) => {
          const articles = day.articles.filter((a) => allowed.has(a.category));
          return { ...day, articles, articleCount: articles.length };
        })
        .filter((day) => day.articleCount > 0);
      return json(c, { days }, 200, CACHE.home);
    }
    return json(c, { days: feed.days }, 200, CACHE.home);
  });
}
