# Ingest contract

`POST /api/ingest` accepts one day's edition as JSON. The endpoint is idempotent per `date`: a new POST replaces that day's stories and rebuilds indexes.

This repository does not contain news content. Keep edition JSON outside the repo (for example in a local `data/` folder).

## Authentication

```
Authorization: Bearer <INGEST_TOKEN>
```

Without a valid token: `401`. Set the token with `wrangler secret put INGEST_TOKEN`. Locally: `.dev.vars`.

## Body

```json
{
  "date": "2026-08-18",
  "generatedAt": "2026-08-18T21:15:00.000Z",
  "articles": [{ "...": "see below" }]
}
```

- `date` (required): `YYYY-MM-DD`. Calendar date of the edition, not the server timezone.
- `generatedAt` (optional): ISO-8601. Metadata only.
- `articles`: 1–30 stories.

### Article

| Field | Type | Rules |
|---|---|---|
| `title` | string | required |
| `dek` | string | required, lede |
| `summary` | string | required, paragraphs separated by `\\n\\n`, no HTML |
| `category` | slug | `norge` \| `usa` \| `internasjonalt` \| `teknologi` \| `okonomi` \| `vitenskap` |
| `date` | `YYYY-MM-DD` | optional, must match the edition date |
| `id` | string | optional `[a-z0-9-]+`. Otherwise `{date}-{slugify(title)}` |
| `implications` | string \| null | optional |
| `conflicts` | string \| null | optional |
| `image` | object | **required cover**: `url` (http/https) + `alt`; `caption`, `credit` and `sourceUrl` optional |
| `figures` | list | optional, max 12 inline images. Same fields as `image` plus `after` (integer ≥ 0: shown after paragraph `after`, 0-based). Figures that do not match a paragraph are appended at the end of the body. |
| `coverage` | list | angle per outlet: `outlet`, `url`, `headline`, `angle` |
| `sources` | list | at least one: `name`, `url` |

No HTML or markdown. The worker stores plain text. `summary` is paragraphs separated by a blank line; `figures[].after` indexes that list.

Example (placeholder, not a real story):

```json
{
  "date": "2026-08-18",
  "articles": [
    {
      "category": "norge",
      "title": "Eksempeltittel",
      "dek": "Kort ingress.",
      "summary": "Første avsnitt.\n\nAndre avsnitt.",
      "image": {
        "url": "https://example.com/cover.jpg",
        "alt": "Beskrivelse av forsidebildet",
        "caption": "Bildetekst",
        "credit": "Kilde"
      },
      "figures": [
        {
          "url": "https://example.com/inline.jpg",
          "alt": "Beskrivelse",
          "caption": "Bildetekst i saken",
          "after": 0
        }
      ],
      "coverage": [
        {
          "outlet": "Medium A",
          "url": "https://example.com/a",
          "headline": "Original overskrift",
          "angle": "Hva dette mediet vektla."
        }
      ],
      "sources": [{ "name": "Medium A", "url": "https://example.com/a" }]
    }
  ]
}
```

## Response

`201`:

```json
{ "ok": true, "date": "2026-08-18", "articleCount": 1, "ids": ["2026-08-18-eksempeltittel"] }
```

```bash
curl -X POST http://127.0.0.1:8787/api/ingest \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @data/edition.json
```

`npm run seed -- data/editions.json` posts one object or an array of objects.
