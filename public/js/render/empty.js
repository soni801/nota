import { escapeHtml } from "../dom.js";

export function skeletonHtml() {
  return `<div class="skeleton" aria-hidden="true">
    <div class="skeleton__block"></div>
    <div class="skeleton__rule"></div>
    <div class="skeleton__block"></div>
    <div class="skeleton__rule"></div>
    <div class="skeleton__block"></div>
  </div>`;
}

export function emptyHtml(message) {
  return `<p class="empty">${escapeHtml(message)}</p>`;
}

export function errorHtml(message) {
  return `<p class="error" role="alert">${escapeHtml(message)}</p>`;
}
