import { copy } from "./copy.js";

export const SITE_NAME = copy.siteName;
export const CATEGORIES = copy.categories;

export function categoryLabel(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

/** Unique known slugs in CATEGORIES order. Unknown tokens are ignored. */
export function parseCategories(raw) {
  if (!raw) return [];
  const allowed = new Set(CATEGORIES.map((c) => c.slug));
  const seen = new Set();
  for (const part of String(raw).split(",")) {
    const slug = part.trim();
    if (allowed.has(slug)) seen.add(slug);
  }
  return CATEGORIES.map((c) => c.slug).filter((slug) => seen.has(slug));
}

export function serializeCategories(slugs) {
  return parseCategories((slugs || []).join(",")).join(",");
}

export function toggleCategory(selected, slug) {
  const next = selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug];
  return parseCategories(next.join(","));
}
