import { CATEGORY_LABELS, messages } from "./copy";

export const CATEGORIES = [
  "norge",
  "usa",
  "internasjonalt",
  "teknologi",
  "okonomi",
  "vitenskap",
] as const;

export type CategorySlug = (typeof CATEGORIES)[number];

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type Image = {
  url: string;
  alt: string;
  caption: string | null;
  credit: string | null;
  sourceUrl: string | null;
};

export type Figure = Image & {
  after: number;
};

export type TeaserImage = {
  url: string;
  alt: string;
};

export type Coverage = {
  outlet: string;
  url: string;
  headline: string;
  angle: string;
};

export type Source = {
  name: string;
  url: string;
};

export type Article = {
  schemaVersion: 1;
  id: string;
  date: string;
  updatedAt: string;
  category: CategorySlug;
  title: string;
  dek: string;
  summary: string;
  implications: string | null;
  image: Image;
  figures: Figure[];
  coverage: Coverage[];
  sources: Source[];
  conflicts: string | null;
};

export type Teaser = {
  id: string;
  date: string;
  category: CategorySlug;
  title: string;
  dek: string;
  sourceCount: number;
  image: TeaserImage;
};

export type DayDoc = {
  schemaVersion: 1;
  date: string;
  updatedAt: string;
  articleCount: number;
  articles: Teaser[];
};

export type HomeFeed = {
  schemaVersion: 1;
  updatedAt: string;
  days: DayDoc[];
};

export type DatesIndex = {
  schemaVersion: 1;
  updatedAt: string;
  dates: string[];
};

export type SearchDoc = {
  id: string;
  date: string;
  category: CategorySlug;
  title: string;
  dek: string;
  text: string;
  sourceCount: number;
  image: TeaserImage;
};

export type SearchIndex = {
  schemaVersion: 1;
  updatedAt: string;
  docs: SearchDoc[];
};

export type MetaDoc = {
  schemaVersion: 1;
  updatedAt: string;
  categories: { slug: CategorySlug; label: string }[];
};

export function isCategory(value: string): value is CategorySlug {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function categoryList(): { slug: CategorySlug; label: string }[] {
  return CATEGORIES.map((slug) => ({ slug, label: CATEGORY_LABELS[slug] }));
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseImage(raw: unknown): Image | typeof INVALID {
  if (typeof raw !== "object" || raw === null) return INVALID;
  const obj = raw as Record<string, unknown>;
  if (!isHttpsUrl(obj.url) || typeof obj.alt !== "string" || !obj.alt.trim()) {
    return INVALID;
  }
  return {
    url: obj.url,
    alt: obj.alt.trim(),
    caption: asString(obj.caption),
    credit: asString(obj.credit),
    sourceUrl: isHttpsUrl(obj.sourceUrl) ? obj.sourceUrl : null,
  };
}

function parseFigures(raw: unknown): Figure[] | typeof INVALID {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > 12) return INVALID;
  const out: Figure[] = [];
  for (const item of raw) {
    const image = parseImage(item);
    if (image === INVALID) return INVALID;
    const afterRaw = (item as Record<string, unknown>).after;
    const after = afterRaw === undefined ? Number.MAX_SAFE_INTEGER : afterRaw;
    if (typeof after !== "number" || !Number.isInteger(after) || after < 0) {
      return INVALID;
    }
    out.push({ ...image, after });
  }
  return out.sort((a, b) => a.after - b.after);
}

const INVALID = Symbol("invalid");

function parseCoverage(raw: unknown): Coverage[] | typeof INVALID {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return INVALID;
  const out: Coverage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return INVALID;
    const obj = item as Record<string, unknown>;
    const outlet = asString(obj.outlet);
    const headline = asString(obj.headline) ?? "";
    const angle = asString(obj.angle);
    if (!outlet || !isHttpsUrl(obj.url) || !angle) return INVALID;
    out.push({ outlet, url: obj.url, headline, angle });
  }
  return out;
}

function parseSources(raw: unknown): Source[] | typeof INVALID {
  if (!Array.isArray(raw) || raw.length < 1) return INVALID;
  const out: Source[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return INVALID;
    const obj = item as Record<string, unknown>;
    const name = asString(obj.name);
    if (!name || !isHttpsUrl(obj.url)) return INVALID;
    out.push({ name, url: obj.url });
  }
  return out;
}

export type IngestBody = {
  date: string;
  generatedAt: string;
  articles: Record<string, unknown>[];
};

export type ValidationOk = { ok: true; date: string; generatedAt: string; rawArticles: Record<string, unknown>[] };
export type ValidationErr = { ok: false; message: string };

export function validateIngestBody(input: unknown): ValidationOk | ValidationErr {
  if (typeof input !== "object" || input === null) {
    return { ok: false, message: messages.invalidJson };
  }
  const body = input as Record<string, unknown>;
  if (typeof body.date !== "string" || !DATE_RE.test(body.date)) {
    return { ok: false, message: messages.invalidDate };
  }
  if (!Array.isArray(body.articles) || body.articles.length < 1 || body.articles.length > 30) {
    return { ok: false, message: messages.articleCount };
  }
  for (const item of body.articles) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, message: messages.articleMustBeObject };
    }
  }
  const generatedAt =
    typeof body.generatedAt === "string" && body.generatedAt
      ? body.generatedAt
      : new Date().toISOString();
  return {
    ok: true,
    date: body.date,
    generatedAt,
    rawArticles: body.articles as Record<string, unknown>[],
  };
}

export function validateRawArticle(
  raw: Record<string, unknown>,
  date: string,
): { ok: true; draft: Omit<Article, "id" | "updatedAt" | "schemaVersion"> & { id?: string } } | ValidationErr {
  const title = asString(raw.title);
  const dek = asString(raw.dek);
  const summary = asString(raw.summary);
  if (!title || !dek || !summary) {
    return { ok: false, message: messages.requiredFields };
  }
  const category = asString(raw.category);
  if (!category || !isCategory(category)) {
    return { ok: false, message: messages.unknownCategory(category ?? "(mangler)") };
  }
  const articleDate = asString(raw.date) ?? date;
  if (articleDate !== date) {
    return { ok: false, message: messages.dateMismatch };
  }
  const image = parseImage(raw.image);
  if (image === INVALID) {
    return { ok: false, message: messages.coverRequired };
  }
  const figures = parseFigures(raw.figures);
  if (figures === INVALID) {
    return { ok: false, message: messages.invalidFigures };
  }
  const coverage = parseCoverage(raw.coverage);
  if (coverage === INVALID) {
    return { ok: false, message: messages.invalidCoverage };
  }
  const sources = parseSources(raw.sources);
  if (sources === INVALID) {
    return { ok: false, message: messages.sourcesRequired };
  }
  const id = asString(raw.id) ?? undefined;
  if (id && !/^[a-z0-9-]+$/.test(id)) {
    return { ok: false, message: messages.invalidId };
  }
  return {
    ok: true,
    draft: {
      id,
      date,
      category,
      title,
      dek,
      summary,
      implications: asString(raw.implications),
      image,
      figures,
      coverage,
      sources,
      conflicts: asString(raw.conflicts),
    },
  };
}

export function toTeaser(article: Article): Teaser {
  return {
    id: article.id,
    date: article.date,
    category: article.category,
    title: article.title,
    dek: article.dek,
    sourceCount: article.sources.length,
    image: { url: article.image.url, alt: article.image.alt },
  };
}

export function toSearchDoc(article: Article): SearchDoc {
  return {
    id: article.id,
    date: article.date,
    category: article.category,
    title: article.title,
    dek: article.dek,
    text: [article.title, article.dek, article.summary].join(" ").normalize("NFC").toLowerCase(),
    sourceCount: article.sources.length,
    image: { url: article.image.url, alt: article.image.alt },
  };
}
