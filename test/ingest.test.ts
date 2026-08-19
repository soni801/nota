import { describe, expect, it } from "vitest";
import { article, dayPayload, ingestRequest, setup } from "./helpers";
import { articleKey, dayKey, KEYS } from "../src/keys";

describe("POST /api/ingest", () => {
  it("rejects missing token with 401", async () => {
    const { app, env } = setup();
    const res = await app.request(
      "/api/ingest",
      ingestRequest(dayPayload("2026-08-18", [article()]), null),
      env,
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
  });

  it("rejects wrong token with 401", async () => {
    const { app, env } = setup();
    const res = await app.request(
      "/api/ingest",
      ingestRequest(dayPayload("2026-08-18", [article()]), "nope"),
      env,
    );
    expect(res.status).toBe(401);
  });

  it("rejects unknown category with 400", async () => {
    const { app, env } = setup();
    const res = await app.request(
      "/api/ingest",
      ingestRequest(dayPayload("2026-08-18", [article({ category: "sport" })])),
      env,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("invalid_payload");
  });

  it("writes article, day, dates, search and home feed", async () => {
    const { app, env, kv } = setup();
    const payload = dayPayload("2026-08-18", [article()]);
    const res = await app.request("/api/ingest", ingestRequest(payload), env);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.date).toBe("2026-08-18");
    expect(body.articleCount).toBe(1);
    expect(body.ids[0]).toBe("2026-08-18-central-bank-holds-policy-rate-unchanged");

    const stored = (await kv.get(articleKey(body.ids[0]), "json")) as {
      title: string;
    };
    expect(stored.title).toContain("Central bank");

    const day = (await kv.get(dayKey("2026-08-18"), "json")) as {
      articles: { id: string }[];
    };
    expect(day.articles).toHaveLength(1);

    const dates = (await kv.get(KEYS.dates, "json")) as { dates: string[] };
    expect(dates.dates[0]).toBe("2026-08-18");

    const search = (await kv.get(KEYS.search, "json")) as { docs: unknown[] };
    expect(search.docs).toHaveLength(1);

    const feed = (await kv.get(KEYS.home, "json")) as { days: unknown[] };
    expect(feed.days).toHaveLength(1);
  });

  it("replaces the same date and deletes orphaned articles", async () => {
    const { app, env, kv } = setup();
    const first = dayPayload("2026-08-18", [
      article({ title: "Old tax story" }),
      article({ title: "Central bank holds rates" }),
    ]);
    await app.request("/api/ingest", ingestRequest(first), env);

    const second = dayPayload("2026-08-18", [
      article({ title: "Central bank holds rates" }),
    ]);
    const res = await app.request("/api/ingest", ingestRequest(second), env);
    expect(res.status).toBe(201);

    const day = (await kv.get(dayKey("2026-08-18"), "json")) as {
      articles: { id: string }[];
    };
    expect(day.articles).toHaveLength(1);

    const orphan = await kv.get(
      articleKey("2026-08-18-old-tax-story"),
      "text",
    );
    expect(orphan).toBeNull();

    const search = (await kv.get(KEYS.search, "json")) as { docs: unknown[] };
    expect(search.docs).toHaveLength(1);
  });
});
