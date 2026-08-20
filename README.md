# Nota

Thin shell for a personal, neutral news site on Cloudflare Workers (static assets + KV). The homepage, archive and article pages render runtime data from KV via `/api/*`. News content is not stored in this repository.

UI language: Norwegian. Code and identifiers are English. Dark mode is the default.

## Stack

- Cloudflare Workers + Static Assets
- Workers KV (`NEWS_KV`)
- Hono (API)
- Vanilla HTML/CSS/JS modules (no bundler)

## Architecture

Static files in `public/` are the shell. `src/index.ts` is a Hono worker. Wrangler sends `/api/*` to the worker first; everything else is an asset, with SPA fallback to `index.html` so `/sak/...` and `/arkiv` work on refresh.

```
Browser  →  /           GET /api/home
         →  /arkiv      GET /api/archive
         →  /sak/:id    GET /api/articles/:id
Writer   →  POST /api/ingest  (Bearer INGEST_TOKEN)  →  NEWS_KV
```

Homepage is the **five latest editions** (dates that exist in the index), not a rolling calendar window.

Public URLs are Norwegian (`/arkiv`, `/sak`, `?kategori=`). The API query name is `category`.

### KV keys

| Key | Value |
|---|---|
| `meta` | Category list and `updatedAt` |
| `feed:home` | Denormalized last five editions (teasers). Homepage is one read. |
| `index:dates` | All edition dates, newest first |
| `index:search` | Compact search corpus (title, dek, summary, category, cover) |
| `day:{YYYY-MM-DD}` | One day's teasers |
| `article:{id}` | Full article. Id is `{date}-{slug}`. |

There is no KV query API. Search and category filters scan `index:search` in the worker (substring, NFC, case-insensitive; æ/ø/å are kept). Ingest is single-writer and idempotent per date: it writes articles, the day doc, then rebuilds dates, search, and `feed:home`.

### HTTP API

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/health` | public |
| `GET` | `/api/meta` | public |
| `GET` | `/api/home?category=` | public |
| `GET` | `/api/articles/:id` | public |
| `GET` | `/api/days/:date` | public |
| `GET` | `/api/archive?q=&category=&from=&to=&page=&pageSize=` | public |
| `POST` | `/api/ingest` | `Authorization: Bearer` |

JSON errors: `{ "error": { "code": "...", "message": "..." } }` with Norwegian `message` for the UI.

Article JSON (cover required, optional inline `figures`) is specified in [docs/ingest-contract.md](docs/ingest-contract.md).

### Layout

| Path | Role |
|---|---|
| `src/index.ts` | Worker entry, route registration |
| `src/schema.ts` | Types and ingest validation |
| `src/copy.ts` | Norwegian API error strings and category labels |
| `src/keys.ts` | KV key helpers |
| `src/lib/` | Auth, KV JSON, search, slug, feed rebuilds |
| `src/routes/` | One file per endpoint group |
| `public/js/copy.js` | Norwegian UI copy and public path helpers |
| `public/js/main.js` | Boot, theme, client router |
| `public/js/render/` | View renderers (escape all KV text) |

## Local development

```bash
npm install
npm test
npm run dev
```

Copy `.dev.vars.example` to `.dev.vars` and set `INGEST_TOKEN`.

The site starts empty. Publish editions with `POST /api/ingest` (see [docs/ingest-contract.md](docs/ingest-contract.md)), or from a JSON file you keep outside the repo:

```bash
npm run seed -- ../path/to/editions.json
```

The JSON file is one edition object or an array of edition objects. Put working copies in `data/` (gitignored) if you want.

Open [http://127.0.0.1:8787](http://127.0.0.1:8787).

## Deploy

1. Create a KV namespace:

```bash
npx wrangler kv namespace create NEWS_KV
```

2. Paste the `id` into `wrangler.jsonc` under `kv_namespaces`.

3. Set the secret:

```bash
npx wrangler secret put INGEST_TOKEN
```

4. Publish:

```bash
npm run deploy
```

Do not use `wrangler pages deploy`. This is a Worker project.

## Updating content

An analyst (or a separate Worker) posts JSON to `POST /api/ingest`. Contract: [docs/ingest-contract.md](docs/ingest-contract.md).

After ingest the homepage updates without a redeploy.

## URLs

| Path | Content |
|---|---|
| `/` | Last five editions |
| `/?kategori=norge` | Same, filtered |
| `/arkiv` | Full archive |
| `/arkiv?q=rente&kategori=norge` | Search and filter |
| `/sak/{id}` | Full article |

## Font licenses

- [Newsreader](https://github.com/productiontype/Newsreader) (OFL)
- [IBM Plex Sans](https://github.com/IBM/plex) (OFL)
