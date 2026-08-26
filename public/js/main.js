import { fetchArchive, fetchArticle, fetchHome } from "./api.js";
import { copy, paths } from "./copy.js";
import { archiveHref, navigate, parseRoute } from "./router.js";
import { renderArchive } from "./render/archive.js";
import { renderArticle } from "./render/article.js";
import { renderHome } from "./render/home.js";
import { emptyHtml } from "./render/empty.js";

const root = document.getElementById("content");
const themeToggle = document.getElementById("theme-toggle");

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem("nota-theme", theme);
  } catch (_err) {
    /* ignore */
  }
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? copy.switchToLight : copy.switchToDark,
  );
}

themeToggle.addEventListener("click", () => {
  applyTheme(currentTheme() === "dark" ? "light" : "dark");
});
applyTheme(currentTheme());

function setActiveNav(routeName) {
  document.querySelectorAll(".masthead__nav a").forEach((link) => {
    const isActive =
      (routeName === "home" && link.dataset.route === "home") ||
      (routeName === "archive" && link.dataset.route === "archive");
    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

let archivePage = 1;
let archiveTotal = 0;
let archiveLoaded = [];
let archiveSearchTimer = 0;
let viewGen = 0;

async function render() {
  const route = parseRoute();
  setActiveNav(route.name);
  clearTimeout(archiveSearchTimer);
  const gen = (viewGen += 1);
  root.focus({ preventScroll: true });

  if (route.name === "home") {
    renderHome(root, { loading: true, days: [], categories: route.categories });
    try {
      const data = await fetchHome(route.categories);
      if (gen !== viewGen) return;
      renderHome(root, { days: data.days, categories: route.categories });
    } catch (error) {
      if (gen !== viewGen) return;
      renderHome(root, { error, days: [], categories: route.categories });
    }
    return;
  }

  if (route.name === "article") {
    renderArticle(root, { loading: true });
    try {
      const article = await fetchArticle(route.id);
      if (gen !== viewGen) return;
      renderArticle(root, { article });
    } catch (error) {
      if (gen !== viewGen) return;
      renderArticle(root, { error });
    }
    return;
  }

  if (route.name === "archive") {
    archivePage = 1;
    archiveLoaded = [];
    renderArchive(root, {
      loading: true,
      days: [],
      q: route.q,
      categories: route.categories,
    });
    try {
      const data = await fetchArchive({
        q: route.q,
        categories: route.categories,
        page: 1,
      });
      if (gen !== viewGen) return;
      archivePage = 1;
      archiveTotal = data.total;
      archiveLoaded = data.days;
      renderArchive(root, {
        days: data.days,
        q: route.q,
        categories: route.categories,
        hasMore: data.days.length < data.total,
      });
    } catch (error) {
      if (gen !== viewGen) return;
      renderArchive(root, { error, days: [], q: route.q, categories: route.categories });
    }
    return;
  }

  document.title = `${copy.pageNotFound} · ${copy.siteName}`;
  root.innerHTML = emptyHtml(copy.pageNotFound);
}

document.addEventListener("click", (event) => {
  const more = event.target.closest("[data-more]");
  if (more) {
    event.preventDefault();
    loadMore();
    return;
  }
  const link = event.target.closest("a[data-nav]");
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.origin && link.origin !== location.origin) return;
  event.preventDefault();
  navigate(link.href);
});

document.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.id !== "archive-search") return;
  clearTimeout(archiveSearchTimer);
  archiveSearchTimer = setTimeout(() => {
    applyArchiveSearch(input.value);
  }, 200);
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.getAttribute("action") !== paths.archive) return;
  event.preventDefault();
  const q = new FormData(form).get("q") || "";
  clearTimeout(archiveSearchTimer);
  applyArchiveSearch(String(q));
});

async function applyArchiveSearch(rawQ) {
  const q = String(rawQ ?? "").trim();
  const route = parseRoute();
  if (route.name !== "archive") return;
  const href = archiveHref(q, route.categories);
  const current = `${location.pathname}${location.search}`;
  if (current !== href) history.replaceState({}, "", href);
  if (route.q === q && current === href && archiveLoaded.length) return;
  const gen = (viewGen += 1);
  try {
    const data = await fetchArchive({ q, categories: route.categories, page: 1 });
    if (gen !== viewGen || parseRoute().name !== "archive") return;
    archivePage = 1;
    archiveTotal = data.total;
    archiveLoaded = data.days;
    renderArchive(root, {
      days: data.days,
      q,
      categories: route.categories,
      hasMore: data.days.length < data.total,
      replaceResults: true,
    });
  } catch (error) {
    if (gen !== viewGen || parseRoute().name !== "archive") return;
    renderArchive(root, {
      error,
      days: [],
      q,
      categories: route.categories,
      replaceResults: true,
    });
  }
}

async function loadMore() {
  const route = parseRoute();
  const next = archivePage + 1;
  const gen = viewGen;
  try {
    const data = await fetchArchive({
      q: route.q,
      categories: route.categories,
      page: next,
    });
    if (gen !== viewGen) return;
    archivePage = next;
    archiveLoaded = archiveLoaded.concat(data.days);
    renderArchive(root, {
      days: data.days,
      q: route.q,
      categories: route.categories,
      append: true,
      hasMore: archiveLoaded.length < archiveTotal,
    });
  } catch (_error) {
    const more = root.querySelector("[data-more]");
    if (more) more.textContent = copy.loadMoreError;
  }
}

window.addEventListener("popstate", render);
window.addEventListener("nota:navigate", render);
render();
