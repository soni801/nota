import { fetchArchive, fetchArticle, fetchHome } from "./api.js";
import { copy, paths } from "./copy.js";
import { navigate, parseRoute } from "./router.js";
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

async function render() {
  const route = parseRoute();
  setActiveNav(route.name);
  root.focus({ preventScroll: true });

  if (route.name === "home") {
    renderHome(root, { loading: true, days: [], category: route.category });
    try {
      const data = await fetchHome(route.category);
      renderHome(root, { days: data.days, category: route.category });
    } catch (error) {
      renderHome(root, { error, days: [], category: route.category });
    }
    return;
  }

  if (route.name === "article") {
    renderArticle(root, { loading: true });
    try {
      const article = await fetchArticle(route.id);
      renderArticle(root, { article });
    } catch (error) {
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
      category: route.category,
    });
    try {
      const data = await fetchArchive({
        q: route.q,
        category: route.category,
        page: 1,
      });
      archivePage = 1;
      archiveTotal = data.total;
      archiveLoaded = data.days;
      renderArchive(root, {
        days: data.days,
        q: route.q,
        category: route.category,
        hasMore: data.days.length < data.total,
      });
    } catch (error) {
      renderArchive(root, { error, days: [], q: route.q, category: route.category });
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

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.getAttribute("action") !== paths.archive) return;
  event.preventDefault();
  const q = new FormData(form).get("q") || "";
  const route = parseRoute();
  const params = new URLSearchParams();
  if (q) params.set("q", String(q));
  if (route.category) params.set(paths.categoryQuery, route.category);
  const qs = params.toString();
  navigate(`${paths.archive}${qs ? `?${qs}` : ""}`);
});

async function loadMore() {
  const route = parseRoute();
  const next = archivePage + 1;
  try {
    const data = await fetchArchive({
      q: route.q,
      category: route.category,
      page: next,
    });
    archivePage = next;
    archiveLoaded = archiveLoaded.concat(data.days);
    renderArchive(root, {
      days: data.days,
      q: route.q,
      category: route.category,
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
