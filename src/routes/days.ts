import type { Hono } from "hono";
import type { Bindings } from "../env";
import { dayKey } from "../keys";
import { apiError, CACHE, json } from "../lib/http";
import { getJson } from "../lib/kv";
import { messages } from "../copy";
import { DATE_RE, type DayDoc } from "../schema";

export function registerDays(app: Hono<{ Bindings: Bindings }>) {
  app.get("/api/days/:date", async (c) => {
    const date = c.req.param("date");
    if (!DATE_RE.test(date)) {
      return apiError(c, 400, "invalid_payload", messages.invalidDate);
    }
    const day = await getJson<DayDoc>(c.env.NEWS_KV, dayKey(date));
    if (!day) {
      return apiError(c, 404, "not_found", messages.dayNotFound);
    }
    return json(c, day, 200, CACHE.day);
  });
}
