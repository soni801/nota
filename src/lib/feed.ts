import { articleKey, dayKey, KEYS } from "../keys";
import type { Article, DatesIndex, DayDoc, HomeFeed, MetaDoc, SearchIndex } from "../schema";
import { categoryList, toSearchDoc } from "../schema";
import { getJson, putJson } from "./kv";

export async function rebuildDates(
  kv: KVNamespace,
  date: string,
  now: string,
): Promise<string[]> {
  const current = (await getJson<DatesIndex>(kv, KEYS.dates)) ?? {
    schemaVersion: 1 as const,
    updatedAt: now,
    dates: [],
  };
  const dates = [...new Set([date, ...current.dates])].sort((a, b) => b.localeCompare(a));
  await putJson(kv, KEYS.dates, {
    schemaVersion: 1,
    updatedAt: now,
    dates,
  } satisfies DatesIndex);
  return dates;
}

export async function rebuildSearch(
  kv: KVNamespace,
  date: string,
  articles: Article[],
  now: string,
): Promise<void> {
  const current = (await getJson<SearchIndex>(kv, KEYS.search)) ?? {
    schemaVersion: 1 as const,
    updatedAt: now,
    docs: [],
  };
  const docs = [
    ...current.docs.filter((d) => d.date !== date),
    ...articles.map(toSearchDoc),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  await putJson(kv, KEYS.search, {
    schemaVersion: 1,
    updatedAt: now,
    docs,
  } satisfies SearchIndex);
}

/** Keep `feed:home` as the five newest editions so the homepage is one KV read. */
export async function rebuildHome(kv: KVNamespace, dates: string[], now: string): Promise<void> {
  const latest = dates.slice(0, 5);
  const days: DayDoc[] = [];
  for (const date of latest) {
    const day = await getJson<DayDoc>(kv, dayKey(date));
    if (day) days.push(day);
  }
  await putJson(kv, KEYS.home, {
    schemaVersion: 1,
    updatedAt: now,
    days,
  } satisfies HomeFeed);
}

export async function touchMeta(kv: KVNamespace, now: string): Promise<void> {
  await putJson(kv, KEYS.meta, {
    schemaVersion: 1,
    updatedAt: now,
    categories: categoryList(),
  } satisfies MetaDoc);
}

export async function deleteOrphans(
  kv: KVNamespace,
  previous: DayDoc | null,
  keepIds: Set<string>,
): Promise<void> {
  if (!previous) return;
  await Promise.all(
    previous.articles
      .filter((teaser) => !keepIds.has(teaser.id))
      .map((teaser) => kv.delete(articleKey(teaser.id))),
  );
}
