import type { Hono } from "hono";
import type { Bindings } from "../env";
import { articleKey, dayKey } from "../keys";
import { authorize } from "../lib/auth";
import { deleteOrphans, rebuildDates, rebuildHome, rebuildSearch, touchMeta } from "../lib/feed";
import { apiError, json } from "../lib/http";
import { getJson, putJson } from "../lib/kv";
import { articleId } from "../lib/slug";
import { messages } from "../copy";
import {
  toTeaser,
  validateIngestBody,
  validateRawArticle,
  type Article,
  type DayDoc,
} from "../schema";

/** Single-writer, idempotent per date. Replaces that day's articles and rebuilds indexes. */
export function registerIngest(app: Hono<{ Bindings: Bindings }>) {
  app.post("/api/ingest", async (c) => {
    if (!authorize(c.req.header("Authorization"), c.env.INGEST_TOKEN)) {
      console.warn("ingest unauthorized");
      return apiError(c, 401, "unauthorized", messages.unauthorized);
    }

    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return apiError(c, 400, "invalid_payload", messages.invalidJson);
    }

    const parsed = validateIngestBody(raw);
    if (!parsed.ok) {
      return apiError(c, 400, "invalid_payload", parsed.message);
    }

    const now = new Date().toISOString();
    const articles: Article[] = [];
    const ids: string[] = [];

    for (const item of parsed.rawArticles) {
      const checked = validateRawArticle(item, parsed.date);
      if (!checked.ok) {
        return apiError(c, 400, "invalid_payload", checked.message);
      }
      const id = articleId(parsed.date, checked.draft.title, checked.draft.id);
      const article: Article = {
        schemaVersion: 1,
        id,
        updatedAt: now,
        date: checked.draft.date,
        category: checked.draft.category,
        title: checked.draft.title,
        dek: checked.draft.dek,
        summary: checked.draft.summary,
        implications: checked.draft.implications,
        image: checked.draft.image,
        figures: checked.draft.figures,
        coverage: checked.draft.coverage,
        sources: checked.draft.sources,
        conflicts: checked.draft.conflicts,
      };
      articles.push(article);
      ids.push(id);
    }

    const kv = c.env.NEWS_KV;
    const previous = await getJson<DayDoc>(kv, dayKey(parsed.date));
    const keepIds = new Set(ids);

    await Promise.all(articles.map((article) => putJson(kv, articleKey(article.id), article)));

    const day: DayDoc = {
      schemaVersion: 1,
      date: parsed.date,
      updatedAt: now,
      articleCount: articles.length,
      articles: articles.map(toTeaser),
    };
    await putJson(kv, dayKey(parsed.date), day);
    await deleteOrphans(kv, previous, keepIds);

    const dates = await rebuildDates(kv, parsed.date, now);
    await rebuildSearch(kv, parsed.date, articles, now);
    await rebuildHome(kv, dates, now);
    await touchMeta(kv, now);

    return json(c, { ok: true, date: parsed.date, articleCount: articles.length, ids }, 201);
  });
}
