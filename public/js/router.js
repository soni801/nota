import { parseCategories, serializeCategories } from "./config.js";
import { paths } from "./copy.js";
import { saveScroll } from "./scroll.js";

export function archiveHref(q, categories = []) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  const serialized = serializeCategories(categories);
  if (serialized) params.set(paths.categoryQuery, serialized);
  const qs = params.toString();
  return `${paths.archive}${qs ? `?${qs}` : ""}`;
}

export function parseRoute(pathname = location.pathname, search = location.search) {
  const params = new URLSearchParams(search);
  const path = pathname.replace(/\/+$/, "") || "/";
  const categories = parseCategories(params.get(paths.categoryQuery));
  if (path === "/") {
    return { name: "home", categories };
  }
  if (path === paths.archive) {
    return {
      name: "archive",
      q: params.get("q") || "",
      categories,
      page: Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1),
    };
  }
  const article = /^\/sak\/([^/]+)$/.exec(path);
  if (article) {
    return { name: "article", id: decodeURIComponent(article[1]) };
  }
  return { name: "notfound" };
}

export function navigate(href, { replace = false } = {}) {
  const url = new URL(href, location.origin);
  saveScroll();
  if (replace) history.replaceState({ scrollY: 0 }, "", url.pathname + url.search);
  else history.pushState({ scrollY: 0 }, "", url.pathname + url.search);
  window.dispatchEvent(new Event("nota:navigate"));
}
