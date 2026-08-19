import { describe, expect, it } from "vitest";
import { article, dayPayload, ingestRequest, setup } from "./helpers";

describe("GET /api/articles/:id", () => {
  it("returns 404 for unknown id", async () => {
    const { app, env } = setup();
    const res = await app.request("/api/articles/finnes-ikke", {}, env);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("not_found");
    expect(body.error.message).toBe("Saken finnes ikke.");
  });

  it("returns the full article", async () => {
    const { app, env } = setup();
    const resIngest = await app.request(
      "/api/ingest",
      ingestRequest(dayPayload("2026-08-18", [article()])),
      env,
    );
    const { ids } = await resIngest.json();
    const res = await app.request(`/api/articles/${ids[0]}`, {}, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toContain("Central bank");
    expect(body.coverage[0].outlet).toBe("Outlet A");
    expect(body.sources).toHaveLength(2);
    expect(body.summary).toContain("Inflation has eased");
  });
});
