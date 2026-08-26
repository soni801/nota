import { describe, expect, it } from "vitest";
import { nextHistoryState, scrollFromState } from "../public/js/scroll.js";

describe("scrollFromState", () => {
  it("reads a saved offset", () => {
    expect(scrollFromState({ scrollY: 480 })).toBe(480);
  });

  it("treats missing or invalid values as the top", () => {
    expect(scrollFromState(null)).toBe(0);
    expect(scrollFromState(undefined)).toBe(0);
    expect(scrollFromState({})).toBe(0);
    expect(scrollFromState({ scrollY: -20 })).toBe(0);
    expect(scrollFromState({ scrollY: "480" })).toBe(0);
  });
});

describe("nextHistoryState", () => {
  it("stores scrollY and keeps other state", () => {
    expect(nextHistoryState({ foo: 1 }, 240)).toEqual({ foo: 1, scrollY: 240 });
    expect(nextHistoryState(null, 80)).toEqual({ scrollY: 80 });
  });
});
