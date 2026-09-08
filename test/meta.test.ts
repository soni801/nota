import { describe, expect, it } from "vitest";
import { setup } from "./helpers";

describe("GET /api/meta", () => {
  it("returns the six categories", async () => {
    const { app, env } = setup();
    const res = await app.request("/api/meta", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.categories.map((c: { slug: string }) => c.slug)).toEqual([
      "norge",
      "usa",
      "internasjonalt",
      "teknologi",
      "okonomi",
      "vitenskap",
    ]);
    expect(body.footerNote).toBeNull();
  });

  it("returns trimmed FOOTER_NOTE when set", async () => {
    const { app, env } = setup();
    const res = await app.request(
      "/api/meta",
      {},
      { ...env, FOOTER_NOTE: "  Ufrivillig sponset.  " },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.footerNote).toBe("Ufrivillig sponset.");
  });

  it("treats a blank FOOTER_NOTE as null", async () => {
    const { app, env } = setup();
    const res = await app.request("/api/meta", {}, { ...env, FOOTER_NOTE: "   " });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.footerNote).toBeNull();
  });
});
