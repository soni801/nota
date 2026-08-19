import type { Hono } from "hono";
import type { Bindings } from "../env";
import { dayKey, KEYS } from "../keys";
import { CACHE, json } from "../lib/http";
import { getJson } from "../lib/kv";
import { filterSearchDocs } from "../lib/search";
import {
  isCategory,
  type DatesIndex,
  type DayDoc,
  type SearchDoc,
  type SearchIndex,
  type Teaser,
} from "../schema";

function parsePage(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function groupDocs(docs: SearchDoc[]): DayDoc[] {
  const map = new Map<string, Teaser[]>();
  for (const doc of docs) {
    const list = map.get(doc.date) ?? [];
    list.push({
      id: doc.id,
      date: doc.date,
      category: doc.category,
      title: doc.title,
      dek: doc.dek,
      sourceCount: doc.sourceCount,
      image: doc.image,
    });
    map.set(doc.date, list);
  }
  return [...map.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((date) => {
      const articles = map.get(date)!;
      return {
        schemaVersion: 1 as const,
        date,
        updatedAt: "",
        articleCount: articles.length,
        articles,
      };
    });
}

export function registerArchive(app: Hono<{ Bindings: Bindings }>) {
  app.get("/api/archive", async (c) => {
    const q = c.req.query("q")?.trim() || undefined;
    const categoryRaw = c.req.query("category");
    const category = categoryRaw && isCategory(categoryRaw) ? categoryRaw : undefined;
    const from = c.req.query("from") || undefined;
    const to = c.req.query("to") || undefined;
    const page = parsePage(c.req.query("page"), 1);
    const pageSize = Math.min(parsePage(c.req.query("pageSize"), 20), 50);
    const filtered = Boolean(q || category || from || to);

    if (filtered) {
      const index = (await getJson<SearchIndex>(c.env.NEWS_KV, KEYS.search)) ?? {
        schemaVersion: 1 as const,
        updatedAt: "",
        docs: [],
      };
      const docs = filterSearchDocs(index.docs, { q, category, from, to });
      const grouped = groupDocs(docs);
      const total = grouped.length;
      const days = grouped.slice((page - 1) * pageSize, page * pageSize);
      return json(c, { page, pageSize, total, days }, 200, CACHE.archive);
    }

    const datesIndex = (await getJson<DatesIndex>(c.env.NEWS_KV, KEYS.dates)) ?? {
      schemaVersion: 1 as const,
      updatedAt: "",
      dates: [],
    };
    const total = datesIndex.dates.length;
    const slice = datesIndex.dates.slice((page - 1) * pageSize, page * pageSize);
    const days = (
      await Promise.all(slice.map((date) => getJson<DayDoc>(c.env.NEWS_KV, dayKey(date))))
    ).filter((day): day is DayDoc => day !== null);
    return json(c, { page, pageSize, total, days }, 200, CACHE.archive);
  });
}
