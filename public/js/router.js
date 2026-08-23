import { parseCategories } from "./config.js";
import { paths } from "./copy.js";

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
  if (replace) history.replaceState({}, "", url.pathname + url.search);
  else history.pushState({}, "", url.pathname + url.search);
  window.dispatchEvent(new Event("nota:navigate"));
}
