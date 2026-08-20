import type { PagesFunction } from "@cloudflare/workers-types";
import type { Bindings } from "../../src/env";
import { createApp } from "../../src/index";

const app = createApp();

export const onRequest: PagesFunction<Bindings> = (context) => {
  return app.fetch(context.request, context.env);
};
