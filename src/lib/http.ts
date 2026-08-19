import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const CACHE = {
  home: "public, max-age=60, stale-while-revalidate=300",
  article: "public, max-age=300, stale-while-revalidate=3600",
  day: "public, max-age=120",
  archive: "public, max-age=60",
  meta: "public, max-age=3600",
} as const;

const NOSNIFF = { "X-Content-Type-Options": "nosniff" };

export function json<T>(
  c: Context,
  data: T,
  status: ContentfulStatusCode = 200,
  cache?: string,
) {
  return c.json(data, status, cache ? { ...NOSNIFF, "Cache-Control": cache } : NOSNIFF);
}

export function apiError(
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
) {
  return c.json({ error: { code, message } }, status, NOSNIFF);
}
