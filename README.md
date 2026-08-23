# Nota

Thin shell for a personal, neutral news site on **Cloudflare Pages**. The homepage, archive and article pages render runtime data from KV via Pages Functions under `/api/*`. News content is not stored in this repository.

UI language: Norwegian. Code and identifiers are English. Dark mode is the default.

## Stack

- Cloudflare Pages (static shell in `public/`)
- Pages Functions (`functions/api/`, `functions/sak/`)
- Workers KV (`NEWS_KV`)
- Hono (API)
- Vanilla HTML/CSS/JS modules (no bundler)

## Architecture

Static files in `public/` are the shell. Pages Functions under `functions/api/` handle `/api/*` and call into `src/`. `/arkiv` rewrites to `index.html`. `/sak/:id` is a Function that serves the same shell with article Open Graph tags (title, dek, cover image) so link previews work.

```
Browser  →  /           GET /api/home
         →  /arkiv      GET /api/archive
         →  /sak/:id    HTML with OG tags, then GET /api/articles/:id
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

There is no KV query API. Search and category filters scan `index:search` in the Function (substring, NFC, case-insensitive; æ/ø/å are kept). Ingest is single-writer and idempotent per date: it writes articles, the day doc, then rebuilds dates, search, and `feed:home`.

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
| `functions/api/[[path]].ts` | Pages Function entry for `/api/*` |
| `functions/sak/[id].ts` | Article HTML with Open Graph / Twitter Card tags |
| `src/index.ts` | Hono app and route registration |
| `src/schema.ts` | Types and ingest validation |
| `src/copy.ts` | Norwegian API error strings and category labels |
| `src/keys.ts` | KV key helpers |
| `src/lib/` | Auth, KV JSON, search, slug, feed rebuilds, Open Graph |
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

## Deploy (Cloudflare Pages)

In the Cloudflare dashboard:

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select `soni801/nota`, branch `main`.
3. Build settings:
   - Framework preset: **None**
   - Build command: `npm ci` (required so Pages Functions can resolve `hono`)
   - Build output directory: `public`
4. **Create KV namespace** (Storage → KV) if you do not have one. Then in the Pages project: **Settings → Bindings → KV namespace**
   - Variable name: `NEWS_KV`
   - Namespace: the one you created
5. **Settings → Environment variables**
   - Name: `INGEST_TOKEN`
   - Value: a long random secret
   - Encrypt / production
6. Save and **deploy**. If you added the binding or secret after the first deploy, trigger a new deployment.

The site is empty until you `POST /api/ingest` with that token.

## Updating content

An analyst (or a separate job) posts JSON to `POST /api/ingest`. Contract: [docs/ingest-contract.md](docs/ingest-contract.md).

After ingest the homepage updates without a redeploy.

## URLs

| Path | Content |
|---|---|
| `/` | Last five editions |
| `/?kategori=norge` | Same, filtered |
| `/arkiv` | Full archive |
| `/arkiv?q=rente&kategori=norge` | Search and filter |
| `/sak/{id}` | Full article (HTML includes a per-article link preview) |

## Font licenses

- [Newsreader](https://github.com/productiontype/Newsreader) (OFL)
- [IBM Plex Sans](https://github.com/IBM/plex) (OFL)
