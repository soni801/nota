import { createApp } from "../src/index";
import { MemoryKV } from "./memory-kv";
import type { Bindings } from "../src/env";

export const TOKEN = "test-secret";

export function setup() {
  const kv = new MemoryKV();
  const env: Bindings = {
    NEWS_KV: kv as unknown as KVNamespace,
    INGEST_TOKEN: TOKEN,
  };
  const app = createApp();
  return { app, kv, env };
}

export function ingestRequest(body: unknown, token: string | null = TOKEN) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  } satisfies RequestInit;
}

export function article(overrides: Record<string, unknown> = {}) {
  return {
    title: "Central bank holds policy rate unchanged",
    dek: "The committee cites inflation uncertainty.",
    summary:
      "The central bank held the policy rate unchanged.\n\nInflation has eased but remains above target.",
    implications: "Markets price the first cut later in the year.",
    category: "norge",
    date: "2026-08-18",
    image: {
      url: "https://example.com/cover.jpg",
      alt: "Cover photo",
      caption: "Cover caption",
      credit: "Example",
      sourceUrl: "https://example.com/source",
    },
    figures: [],
    coverage: [
      {
        outlet: "Outlet A",
        url: "https://example.com/a",
        headline: "Rates held unchanged",
        angle: "Focused on households.",
      },
    ],
    sources: [
      { name: "Outlet A", url: "https://example.com/a" },
      { name: "Outlet B", url: "https://example.com/b" },
    ],
    conflicts: null,
    ...overrides,
  };
}

export function dayPayload(date: string, articles: Record<string, unknown>[]) {
  return {
    date,
    generatedAt: `${date}T21:15:00.000Z`,
    articles,
  };
}
