import { copy } from "./copy.js";

export const SITE_NAME = copy.siteName;
export const CATEGORIES = copy.categories;

export function categoryLabel(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
