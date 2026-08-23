import type { Fetcher, PagesFunction } from "@cloudflare/workers-types";
import type { Bindings } from "../../src/env";
import { CACHE } from "../../src/lib/http";
import { htmlForArticlePath } from "../../src/lib/og";

type Env = Bindings & { ASSETS: Fetcher };

export const onRequest: PagesFunction<Env, "id"> = async (context) => {
  const raw = context.params.id;
  const id = decodeURIComponent(Array.isArray(raw) ? raw.join("/") : raw);
  const origin = new URL(context.request.url).origin;
  const canonical = `${origin}/sak/${encodeURIComponent(id)}`;

  const assetRes = await context.env.ASSETS.fetch(new URL("/index.html", context.request.url));
  const shell = await assetRes.text();
  const html = await htmlForArticlePath(context.env.NEWS_KV, id, canonical, shell);

  const headers = new Headers(assetRes.headers);
  headers.delete("Content-Length");
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", html === shell ? CACHE.home : CACHE.article);

  return new Response(html, { status: 200, headers });
};
