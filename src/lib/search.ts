import type { SearchDoc } from "../schema";

export type SearchOpts = {
  q?: string;
  category?: string;
  categories?: readonly string[];
  from?: string;
  to?: string;
};

/** NFC + lowercase. Diacritics are kept so "ol" does not match "øl". */
export function normalizeQuery(q: string): string {
  return q.normalize("NFC").toLowerCase().trim();
}

export function filterSearchDocs(docs: SearchDoc[], opts: SearchOpts): SearchDoc[] {
  let out = docs;
  const categories = opts.categories ?? (opts.category ? [opts.category] : []);
  if (categories.length) {
    const allowed = new Set(categories);
    out = out.filter((d) => allowed.has(d.category));
  }
  if (opts.from) {
    out = out.filter((d) => d.date >= opts.from!);
  }
  if (opts.to) {
    out = out.filter((d) => d.date <= opts.to!);
  }
  if (opts.q) {
    const terms = normalizeQuery(opts.q).split(/\s+/).filter(Boolean);
    // All terms must match as substrings of the prebuilt `text` field.
    out = out.filter((d) => terms.every((term) => d.text.includes(term)));
  }
  return [...out].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}
