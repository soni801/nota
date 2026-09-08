import type { Hono } from "hono";
import type { Bindings } from "../env";
import { KEYS } from "../keys";
import { CACHE, json } from "../lib/http";
import { getJson } from "../lib/kv";
import { categoryList, type MetaDoc } from "../schema";

function footerNote(raw: string | undefined): string | null {
  const note = raw?.trim() ?? "";
  return note || null;
}

export function registerMeta(app: Hono<{ Bindings: Bindings }>) {
  app.get("/api/meta", async (c) => {
    const stored = await getJson<MetaDoc>(c.env.NEWS_KV, KEYS.meta);
    return json(
      c,
      {
        schemaVersion: 1,
        updatedAt: stored?.updatedAt ?? null,
        categories: categoryList(),
        footerNote: footerNote(c.env.FOOTER_NOTE),
      },
      200,
      CACHE.meta,
    );
  });
}
