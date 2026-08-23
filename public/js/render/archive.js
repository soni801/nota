import { SITE_NAME } from "../config.js";
import { copy, paths } from "../copy.js";
import { escapeHtml } from "../dom.js";
import { emptyHtml, errorHtml, skeletonHtml } from "./empty.js";
import { dayHtml, filterBarHtml } from "./home.js";
import { bindImageFallback } from "./images.js";

function searchForm(q, categories) {
  const serialized = (categories || []).join(",");
  return `<form class="archive-search" method="get" action="${paths.archive}">
    <label class="skip" for="archive-search">${escapeHtml(copy.searchArchive)}</label>
    <input id="archive-search" type="search" name="q" value="${escapeHtml(q)}" placeholder="${escapeHtml(copy.searchArchive)}" />
    ${serialized ? `<input type="hidden" name="${paths.categoryQuery}" value="${escapeHtml(serialized)}" />` : ""}
    <button type="submit">${escapeHtml(copy.search)}</button>
  </form>`;
}

export function renderArchive(root, { loading, error, days, q, categories = [], append, hasMore }) {
  document.title = `${copy.archive} · ${SITE_NAME}`;
  const header = `<h1 class="page-title">${escapeHtml(copy.archive)}</h1>${searchForm(q, categories)}${filterBarHtml(categories, { home: false, q })}`;

  if (loading && !append) {
    root.innerHTML = header + skeletonHtml();
    return;
  }
  if (error) {
    root.innerHTML = header + errorHtml(copy.fetchArchiveError);
    return;
  }
  if (!days.length) {
    root.innerHTML = header + emptyHtml(copy.emptyArchive);
    return;
  }

  const more = hasMore
    ? `<p class="more"><button type="button" data-more>${escapeHtml(copy.loadMore)}</button></p>`
    : "";

  if (append) {
    const moreEl = root.querySelector(".more");
    if (moreEl) moreEl.remove();
    root.insertAdjacentHTML("beforeend", days.map(dayHtml).join("") + more);
    bindImageFallback(root);
    return;
  }

  root.innerHTML = header + days.map(dayHtml).join("") + more;
  bindImageFallback(root);
}
