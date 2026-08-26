import { describe, expect, it } from "vitest";
import { archiveDayHtml } from "../public/js/render/archive.js";
import { formatDate } from "../public/js/dom.js";
import { paths } from "../public/js/copy.js";

const day = {
  date: "2026-08-18",
  articles: [
    {
      id: "2026-08-18-acme",
      date: "2026-08-18",
      category: "teknologi",
      title: "Acme releases new model",
      dek: "Better reasoning in the next generation.",
      sourceCount: 3,
      image: { url: "https://example.com/a.jpg", alt: "Acme" },
    },
  ],
};

describe("archiveDayHtml", () => {
  it("lists titles under the date without dek, image, or category blocks", () => {
    const html = archiveDayHtml(day, { showDek: false });
    expect(html).toContain(formatDate("2026-08-18"));
    expect(html).toContain("Acme releases new model");
    expect(html).toContain(`href="${paths.article("2026-08-18-acme")}"`);
    expect(html).not.toContain("Better reasoning");
    expect(html).not.toContain("example.com/a.jpg");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("cat-block");
    expect(html).not.toMatch(/Teknologi og AI/);
  });

  it("includes dek when searching", () => {
    const html = archiveDayHtml(day, { showDek: true });
    expect(html).toContain("Better reasoning in the next generation.");
    expect(html).not.toContain("<img");
  });

  it("escapes title and dek", () => {
    const html = archiveDayHtml(
      {
        date: "2026-08-18",
        articles: [
          {
            id: "x",
            date: "2026-08-18",
            category: "norge",
            title: "<script>alert(1)</script>",
            dek: "a & b",
            sourceCount: 1,
            image: { url: "https://x.test/i.jpg", alt: "" },
          },
        ],
      },
      { showDek: true },
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("a &amp; b");
  });
});
