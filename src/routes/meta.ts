import type { Hono } from "hono";
import type { Bindings } from "../env";
import { KEYS } from "../keys";
import { CACHE, json } from "../lib/http";
import { getJson } from "../lib/kv";
import { categoryList, type MetaDoc } from "../schema";

export function registerMeta(app: Hono<{ Bindings: Bindings }>) {
  app.get("/api/meta", async (c) => {
    const stored = await getJson<MetaDoc>(c.env.NEWS_KV, KEYS.meta);
    return json(
      c,
      {
        schemaVersion: 1,
        updatedAt: stored?.updatedAt ?? null,
        categories: categoryList(),
      },
      200,
      CACHE.meta,
    );
  });
}
