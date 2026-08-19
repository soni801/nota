import { Hono } from "hono";
import type { Bindings } from "./env";
import { json } from "./lib/http";
import { registerArchive } from "./routes/archive";
import { registerArticles } from "./routes/articles";
import { registerDays } from "./routes/days";
import { registerHome } from "./routes/home";
import { registerIngest } from "./routes/ingest";
import { registerMeta } from "./routes/meta";

export function createApp() {
  const app = new Hono<{ Bindings: Bindings }>();

  app.get("/api/health", (c) => json(c, { ok: true }));

  registerMeta(app);
  registerHome(app);
  registerArticles(app);
  registerDays(app);
  registerArchive(app);
  registerIngest(app);

  return app;
}

const app = createApp();
export default app;
