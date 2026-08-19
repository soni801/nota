import { describe, expect, it } from "vitest";
import { article, dayPayload, ingestRequest, setup } from "./helpers";
import { articleKey, dayKey } from "../src/keys";

const figure = {
  url: "https://example.com/inline.jpg",
  alt: "Inline photo",
  caption: "Caption for the inline figure",
  credit: "Example",
  after: 0,
};

describe("article images", () => {
  it("rejects ingest without a cover image", async () => {
    const { app, env } = setup();
    const res = await app.request(
      "/api/ingest",
      ingestRequest(dayPayload("2026-08-18", [article({ image: null })])),
      env,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toMatch(/forsidebilde/i);
  });

  it("stores cover image on the article and teaser", async () => {
    const { app, env, kv } = setup();
    const res = await app.request(
      "/api/ingest",
      ingestRequest(dayPayload("2026-08-18", [article()])),
      env,
    );
    const { ids } = await res.json();
    const stored = (await kv.get(articleKey(ids[0]), "json")) as {
      image: { url: string; alt: string };
    };
    expect(stored.image.url).toContain("http");
    expect(stored.image.alt).toBeTruthy();

    const day = (await kv.get(dayKey("2026-08-18"), "json")) as {
      articles: { image: { url: string; alt: string } }[];
    };
    expect(day.articles[0].image.url).toBe(stored.image.url);
  });

  it("stores inline figures and returns them on GET", async () => {
    const { app, env } = setup();
    const ingested = await app.request(
      "/api/ingest",
      ingestRequest(dayPayload("2026-08-18", [article({ figures: [figure] })])),
      env,
    );
    const { ids } = await ingested.json();
    const res = await app.request(`/api/articles/${ids[0]}`, {}, env);
    const body = await res.json();
    expect(body.figures).toHaveLength(1);
    expect(body.figures[0].after).toBe(0);
    expect(body.figures[0].caption).toBe("Caption for the inline figure");
    expect(body.image.url).toBeTruthy();
  });

  it("rejects figures with invalid url", async () => {
    const { app, env } = setup();
    const res = await app.request(
      "/api/ingest",
      ingestRequest(
        dayPayload("2026-08-18", [
          article({ figures: [{ ...figure, url: "not-a-url" }] }),
        ]),
      ),
      env,
    );
    expect(res.status).toBe(400);
  });
});
