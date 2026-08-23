async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(body?.error?.message || "Kunne ikke hente data.");
    error.status = res.status;
    error.code = body?.error?.code;
    throw error;
  }
  return body;
}

export function fetchHome(categories = []) {
  const category = Array.isArray(categories) ? categories.join(",") : categories || "";
  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  return getJson(`/api/home${q}`);
}

export function fetchArticle(id) {
  return getJson(`/api/articles/${encodeURIComponent(id)}`);
}

export function fetchArchive({ q = "", categories = [], page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  const category = Array.isArray(categories) ? categories.join(",") : categories || "";
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  if (pageSize !== 20) params.set("pageSize", String(pageSize));
  const qs = params.toString();
  return getJson(`/api/archive${qs ? `?${qs}` : ""}`);
}
