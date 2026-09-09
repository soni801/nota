import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

function pathData(svg: string): string[] {
  return [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
}

describe("brand mark", () => {
  it("uses the same quote mark in logo and favicon", async () => {
    const shell = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
    const logo = await readFile(new URL("../public/logo.svg", import.meta.url), "utf8");
    const favicon = await readFile(new URL("../public/favicon.svg", import.meta.url), "utf8");

    expect(shell).toContain('class="brand"');
    expect(shell).toContain('class="brand__mark"');
    expect(shell).toContain('class="wordmark"');
    expect(logo).toContain('fill="currentColor"');
    const logoPaths = pathData(logo);
    const faviconPaths = pathData(favicon);
    expect(logoPaths).toHaveLength(2);
    expect(faviconPaths).toEqual(logoPaths);
    expect(favicon).toContain("#c45c4a");
    expect(favicon).toContain("#9e2a1f");
    expect(favicon).toContain("prefers-color-scheme: light");
    expect(favicon).not.toMatch(/<text/);
  });
});
