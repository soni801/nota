import { SITE_NAME } from "../config.js";
import { copy, paths } from "../copy.js";
import { escapeHtml, formatDate } from "../dom.js";
import { emptyHtml, errorHtml, skeletonHtml } from "./empty.js";
import { filterBarHtml } from "./home.js";

function searchForm(q, categories) {
  const serialized = (categories || []).join(",");
  return `<form class="archive-search" method="get" action="${paths.archive}" autocomplete="off">
    <label class="skip" for="archive-search">${escapeHtml(copy.searchArchive)}</label>
    <input id="archive-search" type="search" name="q" value="${escapeHtml(q)}" placeholder="${escapeHtml(copy.searchArchive)}" />
    ${serialized ? `<input type="hidden" name="${paths.categoryQuery}" value="${escapeHtml(serialized)}" />` : ""}
    <button type="submit">${escapeHtml(copy.search)}</button>
  </form>`;
}

function moreHtml(hasMore) {
  return hasMore
    ? `<p class="more"><button type="button" data-more>${escapeHtml(copy.loadMore)}</button></p>`
    : "";
}

function archiveResultsHtml({ loading, error, days, q, hasMore }) {
  if (loading) return skeletonHtml();
  if (error) return errorHtml(copy.fetchArchiveError);
  if (!days.length) return emptyHtml(copy.emptyArchive);
  const showDek = Boolean(q);
  return days.map((day) => archiveDayHtml(day, { showDek })).join("") + moreHtml(hasMore);
}

function archiveStoryHtml(article, { showDek }) {
  const dek =
    showDek && article.dek
      ? `<p class="archive-story__dek">${escapeHtml(article.dek)}</p>`
      : "";
  return `<li>
    <a class="archive-story" href="${paths.article(article.id)}" data-nav>
      <span class="archive-story__title">${escapeHtml(article.title)}</span>
      ${dek}
    </a>
  </li>`;
}

function syncArchiveFilterHrefs(root, q, categories) {
  const filters = root.querySelector(".filters");
  if (!filters) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = filterBarHtml(categories, { home: false, q });
  const fresh = wrap.querySelectorAll("a");
  filters.querySelectorAll("a").forEach((a, i) => {
    const href = fresh[i]?.getAttribute("href");
    if (href) a.setAttribute("href", href);
  });
}

export function archiveDayHtml(day, { showDek = false } = {}) {
  return `<section class="archive-day">
    <h2 class="day__heading">${escapeHtml(formatDate(day.date))}</h2>
    <ul class="archive-day__list">${day.articles.map((article) => archiveStoryHtml(article, { showDek })).join("")}</ul>
  </section>`;
}

export function renderArchive(root, { loading, error, days, q, categories = [], append, hasMore, replaceResults }) {
  document.title = `${copy.archive} · ${SITE_NAME}`;
  const resultsHtml = archiveResultsHtml({ loading, error, days, q, hasMore });

  if (append) {
    const moreEl = root.querySelector(".more");
    if (moreEl) moreEl.remove();
    const results = root.querySelector("[data-archive-results]");
    const target = results || root;
    const showDek = Boolean(q);
    target.insertAdjacentHTML(
      "beforeend",
      days.map((day) => archiveDayHtml(day, { showDek })).join("") + moreHtml(hasMore),
    );
    return;
  }

  if (replaceResults) {
    const results = root.querySelector("[data-archive-results]");
    if (results) {
      syncArchiveFilterHrefs(root, q, categories);
      results.innerHTML = resultsHtml;
      return;
    }
  }

  const header = `<div class="archive-head"><h1 class="page-title">${escapeHtml(copy.archive)}</h1>${searchForm(q, categories)}${filterBarHtml(categories, { home: false, q })}</div>`;
  root.innerHTML = `${header}<div data-archive-results>${resultsHtml}</div>`;
}
