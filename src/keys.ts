export const KEYS = {
  meta: "meta",
  home: "feed:home",
  dates: "index:dates",
  search: "index:search",
} as const;

export function articleKey(id: string): string {
  return `article:${id}`;
}

export function dayKey(date: string): string {
  return `day:${date}`;
}
