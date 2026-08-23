import { articleKey } from "../keys";
import { getJson } from "./kv";
import type { Article } from "../schema";

const SITE_NAME = "Nota";

export type OgInput = {
  title: string;
  dek: string;
  image: { url: string; alt: string };
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function meta(attr: "name" | "property", key: string, content: string): string {
  return `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
}

function strip(html: string, pattern: RegExp): string {
  return html.replace(pattern, "");
}

export function injectArticleMeta(html: string, article: OgInput, canonicalUrl: string): string {
  const pageTitle = `${article.title} · ${SITE_NAME}`;
  const tags = [
    `<title>${escapeHtml(pageTitle)}</title>`,
    meta("name", "description", article.dek),
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    meta("property", "og:site_name", SITE_NAME),
    meta("property", "og:locale", "nb_NO"),
    meta("property", "og:type", "article"),
    meta("property", "og:title", article.title),
    meta("property", "og:description", article.dek),
    meta("property", "og:url", canonicalUrl),
    meta("property", "og:image", article.image.url),
    meta("property", "og:image:alt", article.image.alt),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", article.title),
    meta("name", "twitter:description", article.dek),
    meta("name", "twitter:image", article.image.url),
    meta("name", "twitter:image:alt", article.image.alt),
  ].join("\n    ");

  let out = html;
  out = strip(out, /<title>[^<]*<\/title>\s*/i);
  out = strip(out, /<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>\s*/i);
  out = strip(
    out,
    /<meta\b[^>]*\b(?:name|property)\s*=\s*["'](?:og|twitter):[^"']+["'][^>]*>\s*/gi,
  );
  out = strip(out, /<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>\s*/gi);

  if (!/<\/head>/i.test(out)) {
    return `${tags}\n${out}`;
  }
  return out.replace(/\s*<\/head>/i, `\n    ${tags}\n  </head>`);
}

export async function htmlForArticlePath(
  kv: KVNamespace,
  id: string,
  canonicalUrl: string,
  shellHtml: string,
): Promise<string> {
  const article = await getJson<Article>(kv, articleKey(id));
  if (!article) return shellHtml;
  return injectArticleMeta(shellHtml, article, canonicalUrl);
}
