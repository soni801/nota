import { escapeHtml } from "../dom.js";

export function captionHtml(image) {
  const caption = image.caption || "";
  const credit = image.credit || "";
  if (!caption && !credit) return "";
  const text = caption && credit ? `${caption} · ${credit}` : caption || credit;
  return `<figcaption>${escapeHtml(text)}</figcaption>`;
}

export function figureHtml(image, className) {
  if (!image?.url) return "";
  return `<figure class="${className}">
    <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt || "")}" referrerpolicy="no-referrer" data-fallback />
    ${captionHtml(image)}
  </figure>`;
}

export function bodyHtml(summary, figures = []) {
  const paragraphs = String(summary)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const placed = new Set();
  let html = "";
  for (let i = 0; i < paragraphs.length; i++) {
    html += `<p>${escapeHtml(paragraphs[i])}</p>`;
    figures.forEach((fig, idx) => {
      if (fig.after === i) {
        html += figureHtml(fig, "inline-image");
        placed.add(idx);
      }
    });
  }
  figures.forEach((fig, idx) => {
    if (!placed.has(idx)) html += figureHtml(fig, "inline-image");
  });
  return html;
}

export function bindImageFallback(root) {
  root.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener("error", () => {
      const figure = img.closest("figure");
      if (figure) figure.hidden = true;
      const thumb = img.closest(".story__media");
      if (thumb) thumb.hidden = true;
    });
  });
}
