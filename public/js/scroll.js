export function nextHistoryState(prev, scrollY) {
  const base = prev && typeof prev === "object" && !Array.isArray(prev) ? prev : {};
  return { ...base, scrollY: Math.max(0, Number(scrollY) || 0) };
}

export function scrollFromState(state) {
  const y = state?.scrollY;
  return typeof y === "number" && Number.isFinite(y) && y > 0 ? y : 0;
}

export function saveScroll() {
  history.replaceState(
    nextHistoryState(history.state, window.scrollY),
    "",
    location.pathname + location.search,
  );
}

export function applyScroll(y) {
  window.scrollTo(0, Math.max(0, y));
}

export function lockScroll(y) {
  const top = Math.max(0, y);
  document.documentElement.style.minHeight = `${top + window.innerHeight}px`;
  applyScroll(top);
}

export function unlockScroll() {
  document.documentElement.style.minHeight = "";
}
