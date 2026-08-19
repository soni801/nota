import { CATEGORIES, categoryLabel, SITE_NAME } from "../config.js";
import { copy, paths } from "../copy.js";
import { escapeHtml, formatDate, sourceLabel } from "../dom.js";
import { emptyHtml, errorHtml, skeletonHtml } from "./empty.js";
import { bindImageFallback } from "./images.js";

function storyHtml(article) {
  const thumb = article.image?.url
    ? `<span class="story__media">
        <img class="story__thumb" src="${escapeHtml(article.image.url)}" alt="${escapeHtml(article.image.alt || "")}" referrerpolicy="no-referrer" data-fallback />
      </span>`
    : "";
  return `<a class="story" href="${paths.article(article.id)}" data-nav>
    <span class="story__text">
      <h3 class="story__title">${escapeHtml(article.title)}</h3>
      <p class="story__dek">${escapeHtml(article.dek)}</p>
      <p class="story__meta">${escapeHtml(sourceLabel(article.sourceCount))}</p>
    </span>
    ${thumb}
  </a>`;
}

function groupByCategory(articles) {
  return CATEGORIES.map((cat) => ({
    ...cat,
    articles: articles.filter((a) => a.category === cat.slug),
  })).filter((g) => g.articles.length);
}

export function dayHtml(day) {
  const groups = groupByCategory(day.articles);
  const blocks = groups
    .map(
      (group) => `<section class="cat-block">
        <h3 class="cat-block__label">${escapeHtml(group.label)}</h3>
        ${group.articles.map(storyHtml).join("")}
      </section>`,
    )
    .join("");
  return `<section class="day">
    <h2 class="day__heading">${escapeHtml(formatDate(day.date))}</h2>
    ${blocks}
  </section>`;
}

export function filterBarHtml(active, { home = true, q = "" } = {}) {
  const base = home ? paths.home : paths.archive;
  const items = [{ slug: "", label: copy.all }, ...CATEGORIES.map((c) => ({ slug: c.slug, label: categoryLabel(c.slug) }))];
  return `<nav class="filters" aria-label="${escapeHtml(copy.categoryNav)}">${items
    .map((item) => {
      const params = new URLSearchParams();
      if (!home && q) params.set("q", q);
      if (item.slug) params.set(paths.categoryQuery, item.slug);
      const qs = params.toString();
      const href = qs ? `${base}?${qs}` : base;
      const cls = item.slug === active ? "is-active" : "";
      return `<a href="${href}" data-nav class="${cls}">${escapeHtml(item.label)}</a>`;
    })
    .join("")}</nav>`;
}

export function renderHome(root, { loading, error, days, category }) {
  document.title = SITE_NAME;
  if (loading) {
    root.innerHTML = filterBarHtml(category) + skeletonHtml();
    return;
  }
  if (error) {
    root.innerHTML = filterBarHtml(category) + errorHtml(copy.fetchHomeError);
    return;
  }
  if (!days.length) {
    const message = category ? copy.emptyCategory : copy.emptyHome;
    root.innerHTML = filterBarHtml(category) + emptyHtml(message);
    return;
  }
  root.innerHTML = filterBarHtml(category) + days.map(dayHtml).join("");
  bindImageFallback(root);
}
