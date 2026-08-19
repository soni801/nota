import { categoryLabel, SITE_NAME } from "../config.js";
import { copy, paths } from "../copy.js";
import { escapeHtml, formatDate } from "../dom.js";
import { emptyHtml, errorHtml, skeletonHtml } from "./empty.js";
import { bindImageFallback, bodyHtml, figureHtml } from "./images.js";

export function renderArticle(root, { loading, error, article }) {
  if (loading) {
    document.title = SITE_NAME;
    root.innerHTML = skeletonHtml();
    return;
  }
  if (error?.status === 404) {
    document.title = `${copy.articleNotFound} · ${SITE_NAME}`;
    root.innerHTML = emptyHtml(copy.articleNotFound);
    return;
  }
  if (error || !article) {
    document.title = SITE_NAME;
    root.innerHTML = errorHtml(copy.fetchArticleError);
    return;
  }

  document.title = `${article.title} · ${SITE_NAME}`;
  const cover = figureHtml(article.image, "lead-image");

  const implications = article.implications
    ? `<section class="article__section">
        <h2>${escapeHtml(copy.meaning)}</h2>
        <p>${escapeHtml(article.implications)}</p>
      </section>`
    : "";

  const conflicts = article.conflicts
    ? `<section class="article__section">
        <h2>${escapeHtml(copy.conflicting)}</h2>
        <p class="conflicts">${escapeHtml(article.conflicts)}</p>
      </section>`
    : "";

  const coverage = article.coverage?.length
    ? `<section class="article__section">
        <h2>${escapeHtml(copy.coverage)}</h2>
        <ul class="coverage">
          ${article.coverage
            .map(
              (item) => `<li>
                <a class="coverage__outlet" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.outlet)}</a>
                ${item.headline ? `<span class="coverage__headline">${escapeHtml(item.headline)}</span>` : ""}
                <p class="coverage__angle">${escapeHtml(item.angle)}</p>
              </li>`,
            )
            .join("")}
        </ul>
      </section>`
    : "";

  const sources = article.sources?.length
    ? `<section class="article__section">
        <h2>${escapeHtml(copy.sources)}</h2>
        <ul class="sources">
          ${article.sources
            .map(
              (s) => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.name)}</a></li>`,
            )
            .join("")}
        </ul>
      </section>`
    : "";

  root.innerHTML = `<article class="article">
    <p class="crumb">
      <a href="${paths.home}" data-nav>${escapeHtml(copy.allStories)}</a>
      · ${escapeHtml(formatDate(article.date))}
      · ${escapeHtml(categoryLabel(article.category))}
    </p>
    <h1 class="article__title">${escapeHtml(article.title)}</h1>
    <p class="article__dek">${escapeHtml(article.dek)}</p>
    ${cover}
    <div class="article__body">${bodyHtml(article.summary, article.figures || [])}</div>
    ${implications}
    ${conflicts}
    ${coverage}
    ${sources}
  </article>`;

  bindImageFallback(root);
}
