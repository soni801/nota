import type { SearchDoc } from "../schema";

export type SearchOpts = {
  q?: string;
  category?: string;
  from?: string;
  to?: string;
};

export function normalizeQuery(q: string): string {
  return q.normalize("NFC").toLowerCase().trim();
}

export function filterSearchDocs(docs: SearchDoc[], opts: SearchOpts): SearchDoc[] {
  let out = docs;
  if (opts.category) {
    out = out.filter((d) => d.category === opts.category);
  }
  if (opts.from) {
    out = out.filter((d) => d.date >= opts.from!);
  }
  if (opts.to) {
    out = out.filter((d) => d.date <= opts.to!);
  }
  if (opts.q) {
    const terms = normalizeQuery(opts.q).split(/\s+/).filter(Boolean);
    out = out.filter((d) => terms.every((term) => d.text.includes(term)));
  }
  return [...out].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}
