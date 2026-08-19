import { describe, expect, it } from "vitest";
import { article, dayPayload, ingestRequest, setup } from "./helpers";

describe("GET /api/home", () => {
  it("returns empty days when KV is empty", async () => {
    const { app, env } = setup();
    const res = await app.request("/api/home", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.days).toEqual([]);
  });

  it("returns at most five editions, newest first", async () => {
    const { app, env } = setup();
    for (let day = 13; day <= 18; day++) {
      const date = `2026-08-${day}`;
      await app.request(
        "/api/ingest",
        ingestRequest(dayPayload(date, [article({ date, title: `Story ${date}` })])),
        env,
      );
    }
    const res = await app.request("/api/home", {}, env);
    const body = await res.json();
    expect(body.days).toHaveLength(5);
    expect(body.days.map((d: { date: string }) => d.date)).toEqual([
      "2026-08-18",
      "2026-08-17",
      "2026-08-16",
      "2026-08-15",
      "2026-08-14",
    ]);
  });

  it("filters by category and drops empty days", async () => {
    const { app, env } = setup();
    await app.request(
      "/api/ingest",
      ingestRequest(
        dayPayload("2026-08-18", [
          article({ category: "norge" }),
          article({
            category: "usa",
            title: "Congress passes budget",
            date: "2026-08-18",
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
            category: "usa",
            title: "Fed holds rates",
            date: "2026-08-17",
          }),
        ]),
      ),
      env,
    );

    const res = await app.request("/api/home?category=norge", {}, env);
    const body = await res.json();
    expect(body.days).toHaveLength(1);
    expect(body.days[0].date).toBe("2026-08-18");
    expect(body.days[0].articles).toHaveLength(1);
    expect(body.days[0].articles[0].category).toBe("norge");
  });
});
