# Nota

Thin shell for a personal, neutral news site on Cloudflare Workers (static assets + KV). The homepage, archive and article pages render runtime data from KV via `/api/*`. News content is not stored in this repository.

UI language: Norwegian. Dark mode is the default.

## Stack

- Cloudflare Workers + Static Assets
- Workers KV (`NEWS_KV`)
- Hono (API)
- Vanilla HTML/CSS/JS modules (no bundler)

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
