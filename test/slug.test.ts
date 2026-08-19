import { describe, expect, it } from "vitest";
import { slugify } from "../src/lib/slug";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Central Bank Rate")).toBe("central-bank-rate");
  });

  it("maps æ ø å to ascii", () => {
    expect(slugify("Blå øy i nærheten")).toBe("bla-oy-i-naerheten");
  });

  it("strips punctuation and collapses hyphens", () => {
    expect(slugify("USA: «Ny avtale» — 4,25 %")).toBe("usa-ny-avtale-4-25");
  });
});
