// Tema oscuro / claro / auto (sistema). Persistencia en localStorage.
const THEME_KEY = "ail_ops_theme_v1";
const MODES = ["auto", "light", "dark"];
const mq = window.matchMedia("(prefers-color-scheme: light)");
const listeners = [];

export function getThemeMode() {
  try { const m = localStorage.getItem(THEME_KEY); return MODES.includes(m) ? m : "auto"; }
  catch { return "auto"; }
}
export function resolveTheme(mode = getThemeMode()) {
  if (mode === "light" || mode === "dark") return mode;
  return mq.matches ? "light" : "dark";
}
function applyTheme() {
  document.documentElement.dataset.theme = resolveTheme();
}
export function setThemeMode(mode) {
  if (!MODES.includes(mode)) mode = "auto";
  try { localStorage.setItem(THEME_KEY, mode); } catch {}
  applyTheme();
  listeners.forEach((cb) => cb(mode));
}
export function cycleThemeMode() {
  const next = MODES[(MODES.indexOf(getThemeMode()) + 1) % MODES.length];
  setThemeMode(next);
  return next;
}
export function onThemeModeChange(cb) { listeners.push(cb); }
export function initTheme() {
  applyTheme();
  mq.addEventListener("change", () => { if (getThemeMode() === "auto") applyTheme(); });
}
