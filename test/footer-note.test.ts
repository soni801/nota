import { describe, expect, it } from "vitest";
import { applyFooterNote } from "../public/js/dom.js";

function el() {
  return { hidden: true, textContent: "" };
}

describe("applyFooterNote", () => {
  it("hides and clears when the note is empty", () => {
    const node = { hidden: false, textContent: "old" };
    applyFooterNote(node, null);
    expect(node.hidden).toBe(true);
    expect(node.textContent).toBe("");
    applyFooterNote(node, "   ");
    expect(node.hidden).toBe(true);
    expect(node.textContent).toBe("");
  });

  it("shows trimmed plain text and does not interpret HTML", () => {
    const node = el();
    applyFooterNote(node, "  Ufrivillig sponset. <b>x</b>  ");
    expect(node.hidden).toBe(false);
    expect(node.textContent).toBe("Ufrivillig sponset. <b>x</b>");
  });
});
