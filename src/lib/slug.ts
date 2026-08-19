export function slugify(title: string): string {
  return title
    .normalize("NFC")
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function articleId(date: string, title: string, explicit?: string): string {
  if (explicit) return explicit;
  return `${date}-${slugify(title)}`;
}
