import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { article, dayPayload, ingestRequest, setup } from "./helpers";

const SHELL = `<!DOCTYPE html>
<html lang="no">
  <head>
    <title>Nota</title>
    <meta
      name="description"
      content="Nøytral dagsbrief. De viktigste sakene, kildesammenlignet."
    />
    <meta property="og:title" content="Nota" />
  </head>
  <body></body>
</html>`;

describe("injectArticleMeta", () => {
  it("replaces title and description and adds image preview tags", async () => {
    const { injectArticleMeta } = await import("../src/lib/og");
    const html = injectArticleMeta(
      SHELL,
      {
        title: "Norges Bank holder renten uendret",
        dek: "Komiteen viser til usikker inflasjon.",
        image: { url: "https://example.com/cover.jpg", alt: "Sentralbanken" },
      },
      "https://nota.example/sak/2026-08-18-norges-bank",
    );

    expect(html).toContain("<title>Norges Bank holder renten uendret · nota.example</title>");
    expect(html).toContain('property="og:site_name" content="nota.example"');
    expect(html).toContain(
      'name="description" content="Komiteen viser til usikker inflasjon."',
    );
    expect(html).toContain('property="og:title" content="Norges Bank holder renten uendret"');
    expect(html).toContain('property="og:description" content="Komiteen viser til usikker inflasjon."');
    expect(html).toContain('property="og:image" content="https://example.com/cover.jpg"');
    expect(html).toContain('property="og:image:alt" content="Sentralbanken"');
    expect(html).toContain('property="og:url" content="https://nota.example/sak/2026-08-18-norges-bank"');
    expect(html).toContain('property="og:type" content="article"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:image" content="https://example.com/cover.jpg"');
    expect(html).toContain('rel="canonical" href="https://nota.example/sak/2026-08-18-norges-bank"');
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html).not.toContain("<title>Nota</title>");
  });

  it("escapes quotes and tags in title, dek and alt", async () => {
    const { injectArticleMeta } = await import("../src/lib/og");
    const html = injectArticleMeta(
      SHELL,
      {
        title: `Rente "uendret" <i dag>`,
        dek: `Usikkerhet & "inflasjon"`,
        image: { url: "https://example.com/a.jpg", alt: `Bildet av "banken"` },
      },
      "https://nota.example/sak/x",
    );

    expect(html).toContain("Rente &quot;uendret&quot; &lt;i dag&gt;");
    expect(html).toContain("Usikkerhet &amp; &quot;inflasjon&quot;");
    expect(html).toContain("Bildet av &quot;banken&quot;");
    expect(html).not.toContain(`<i dag>`);
    expect(html).not.toContain(`content="Rente "uendret"`);
  });

  it("does not strip charset or viewport when replacing existing og tags", async () => {
    const { injectArticleMeta } = await import("../src/lib/og");
    const html = injectArticleMeta(
      `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Nota</title>
    <meta name="description" content="Forside." />
    <meta property="og:title" content="Nota" />
    <meta name="twitter:card" content="summary" />
  </head>
  <body></body>
</html>`,
      {
        title: "En sak",
        dek: "Ingress.",
        image: { url: "https://cdn.example/foto.jpg", alt: "Foto" },
      },
      "https://nota.example/sak/en-sak",
    );

    expect(html).toContain('charset="utf-8"');
    expect(html).toContain('name="viewport"');
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html).toContain('property="og:title" content="En sak"');
    expect(html).not.toContain('name="twitter:card" content="summary"');
  });

  it("injects into the real index.html shell", async () => {
    const { injectArticleMeta } = await import("../src/lib/og");
    const shell = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
    expect(shell).not.toContain("Nota");
    expect(shell).toContain('src="/js/brand.js"');
    const html = injectArticleMeta(
      shell,
      {
        title: "En sak",
        dek: "Ingress.",
        image: { url: "https://cdn.example/foto.jpg", alt: "Foto" },
      },
      "https://nota.example/sak/en-sak",
    );

    expect(html).toContain("<title>En sak · nota.example</title>");
    expect(html).toContain('property="og:site_name" content="nota.example"');
    expect(html).toContain('property="og:image" content="https://cdn.example/foto.jpg"');
    expect(html).toContain('property="og:type" content="article"');
    expect(html).not.toContain('property="og:type" content="website"');
    expect(html).toContain('charset="utf-8"');
    expect(html).toContain('src="/js/main.js"');
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
  });

  it("uses the canonical host, including port, as the site name", async () => {
    const { injectArticleMeta } = await import("../src/lib/og");
    const html = injectArticleMeta(
      SHELL,
      {
        title: "En sak",
        dek: "Ingress.",
        image: { url: "https://cdn.example/foto.jpg", alt: "Foto" },
      },
      "http://localhost:8788/sak/en-sak",
    );

    expect(html).toContain("<title>En sak · localhost:8788</title>");
    expect(html).toContain('property="og:site_name" content="localhost:8788"');
    expect(html).not.toContain("Nota");
  });
});

describe("htmlForArticlePath", () => {
  it("uses the article from KV when it exists", async () => {
    const { htmlForArticlePath } = await import("../src/lib/og");
    const { app, env } = setup();
    const resIngest = await app.request(
      "/api/ingest",
      ingestRequest(dayPayload("2026-08-18", [article()])),
      env,
    );
    const { ids } = await resIngest.json();
    const html = await htmlForArticlePath(
      env.NEWS_KV,
      ids[0],
      `https://nota.example/sak/${ids[0]}`,
      SHELL,
    );
    expect(html).toContain("Central bank holds policy rate unchanged");
    expect(html).toContain("https://example.com/cover.jpg");
    expect(html).toContain('property="og:type" content="article"');
  });

  it("leaves the homepage shell when the article is missing", async () => {
    const { htmlForArticlePath } = await import("../src/lib/og");
    const { env } = setup();
    const html = await htmlForArticlePath(
      env.NEWS_KV,
      "finnes-ikke",
      "https://nota.example/sak/finnes-ikke",
      SHELL,
    );
    expect(html).toBe(SHELL);
  });
});
