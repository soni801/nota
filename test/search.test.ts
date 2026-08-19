import { describe, expect, it } from "vitest";
import { filterSearchDocs, normalizeQuery } from "../src/lib/search";
import type { SearchDoc } from "../src/schema";

const docs: SearchDoc[] = [
  {
    id: "2026-08-18-central-bank-rates",
    date: "2026-08-18",
    category: "norge",
    title: "Central bank holds rates unchanged",
    dek: "Inflation uncertainty",
    text: "central bank holds rates unchanged inflation uncertainty",
    sourceCount: 2,
    image: { url: "https://example.com/cover.jpg", alt: "Cover" },
  },
  {
    id: "2026-08-17-acme-model",
    date: "2026-08-17",
    category: "teknologi",
    title: "Acme releases new model",
    dek: "Better reasoning",
    text: "acme releases new model better reasoning",
    sourceCount: 4,
    image: { url: "https://example.com/acme.jpg", alt: "Acme" },
  },
];

describe("search", () => {
  it("normalizes query with NFC and lowercase without stripping diacritics", () => {
    expect(normalizeQuery("  Øl og Ås  ")).toBe("øl og ås");
  });

  it("matches when all terms are present, case-insensitive", () => {
    const hits = filterSearchDocs(docs, { q: "Central RATES" });
    expect(hits.map((d) => d.id)).toEqual(["2026-08-18-central-bank-rates"]);
  });

  it("preserves æøå so ol does not match øl", () => {
    const withOl: SearchDoc[] = [
      { ...docs[0], text: "oljeprisene stiger", title: "Olje", dek: "", id: "a" },
      { ...docs[0], text: "øl-avgift øker", title: "Øl", dek: "", id: "b" },
    ];
    expect(filterSearchDocs(withOl, { q: "øl" }).map((d) => d.id)).toEqual(["b"]);
    expect(filterSearchDocs(withOl, { q: "ol" }).map((d) => d.id)).toEqual(["a"]);
  });

  it("filters by category", () => {
    const hits = filterSearchDocs(docs, { category: "teknologi" });
    expect(hits).toHaveLength(1);
    expect(hits[0].id).toBe("2026-08-17-acme-model");
  });

  it("filters by date range", () => {
    const hits = filterSearchDocs(docs, { from: "2026-08-18", to: "2026-08-18" });
    expect(hits).toHaveLength(1);
    expect(hits[0].date).toBe("2026-08-18");
  });
});
