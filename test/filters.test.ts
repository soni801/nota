import { describe, expect, it } from "vitest";
import { parseRoute } from "../public/js/router.js";
import { filterBarHtml } from "../public/js/render/home.js";

function hrefFor(html: string, label: string): string {
  const match = html.match(new RegExp(`href="([^"]+)"[^>]*>${label}<`));
  if (!match) throw new Error(`no href for ${label}`);
  return decodeURIComponent(match[1]);
}

describe("category filter bar", () => {
  it("parses comma-separated kategori query into slugs", () => {
    expect(parseRoute("/", "?kategori=usa,norge")).toEqual({
      name: "home",
      categories: ["norge", "usa"],
    });
  });

  it("adds a second category instead of replacing", () => {
    const html = filterBarHtml(["norge"]);
    expect(hrefFor(html, "USA")).toBe("/?kategori=norge,usa");
    expect(hrefFor(html, "Norge")).toBe("/");
    expect(hrefFor(html, "Alle")).toBe("/");
    expect(html).toMatch(/class="is-active" aria-current="true">Norge</);
    expect(html).not.toMatch(/class="is-active"[^>]*>Alle</);
  });

  it("keeps archive search query when toggling categories", () => {
    const html = filterBarHtml(["norge"], { home: false, q: "rente" });
    expect(hrefFor(html, "USA")).toBe("/arkiv?q=rente&kategori=norge,usa");
  });
});
