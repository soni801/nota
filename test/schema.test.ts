import { describe, expect, it } from "vitest";
import { parseCategories } from "../src/schema";

describe("parseCategories", () => {
  it("returns unique known slugs in canonical order", () => {
    expect(parseCategories("teknologi,norge,norge,foo")).toEqual(["norge", "teknologi"]);
  });

  it("trims tokens and ignores unknown values", () => {
    expect(parseCategories("  usa , sport ")).toEqual(["usa"]);
    expect(parseCategories(undefined)).toEqual([]);
    expect(parseCategories("sport")).toEqual([]);
  });
});
