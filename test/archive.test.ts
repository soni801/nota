import { describe, expect, it } from "vitest";
import { article, dayPayload, ingestRequest, setup } from "./helpers";

describe("GET /api/archive", () => {
  async function seed(app: ReturnType<typeof setup>["app"], env: ReturnType<typeof setup>["env"]) {
    await app.request(
      "/api/ingest",
      ingestRequest(
        dayPayload("2026-08-18", [
          article({ category: "norge" }),
          article({
            category: "teknologi",
            title: "Acme releases new model",
            dek: "Better reasoning in the next generation.",
            summary: "Acme announced a new model with better reasoning.",
          }),
        ]),
      ),
      env,
    );
    await app.request(
      "/api/ingest",
      ingestRequest(
        dayPayload("2026-08-17", [
          article({
            date: "2026-08-17",
            category: "usa",
            title: "Fed holds rates unchanged",
            dek: "The central bank waits.",
            summary: "The Federal Reserve held rates unchanged.",
          }),
        ]),
      ),
      env,
    );
  }

  it("lists editions newest first", async () => {
    const { app, env } = setup();
    await seed(app, env);
    const res = await app.request("/api/archive", {}, env);
    const body = await res.json();
    expect(body.days.map((d: { date: string }) => d.date)).toEqual([
      "2026-08-18",
      "2026-08-17",
    ]);
    expect(body.total).toBe(2);
  });

  it("searches case-insensitively in titles", async () => {
    const { app, env } = setup();
    await seed(app, env);
    const res = await app.request("/api/archive?q=acme", {}, env);
    const body = await res.json();
    expect(body.days).toHaveLength(1);
    expect(body.days[0].articles[0].title).toMatch(/Acme/);
  });

  it("filters by category", async () => {
    const { app, env } = setup();
    await seed(app, env);
    const res = await app.request("/api/archive?category=usa", {}, env);
    const body = await res.json();
    expect(body.days).toHaveLength(1);
    expect(body.days[0].articles[0].category).toBe("usa");
  });

  it("filters by multiple categories", async () => {
    const { app, env } = setup();
    await seed(app, env);
    const res = await app.request("/api/archive?category=norge,teknologi", {}, env);
    const body = await res.json();
    expect(body.days).toHaveLength(1);
    expect(body.days[0].articles.map((a: { category: string }) => a.category).sort()).toEqual([
      "norge",
      "teknologi",
    ]);
  });

  it("paginates dates", async () => {
    const { app, env } = setup();
    await seed(app, env);
    const res = await app.request("/api/archive?page=2&pageSize=1", {}, env);
    const body = await res.json();
    expect(body.page).toBe(2);
    expect(body.days).toHaveLength(1);
    expect(body.days[0].date).toBe("2026-08-17");
    expect(body.total).toBe(2);
  });
});
