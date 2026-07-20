// Small formatting/DOM helpers shared by every app/ui/*.js component.
// No state, no side effects beyond reading the current Date — safe to
// import from anywhere.

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

export function initials(name) {
  const n = String(name || "").trim();
  if (!n) return "?";
  const cleaned = n.replace(/[^A-Za-zÀ-ÿ ]/g, "").trim();
  const parts = (cleaned || n).split(/\s+/).slice(0, 2);
  const out = parts.map((w) => w[0]).join("").toUpperCase();
  return out || n.slice(0, 2).toUpperCase();
}

export function relTime(iso) {
  if (!iso) return "—";
  const ts = typeof iso === "number" ? iso : new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const s = (Date.now() - ts) / 1000;
  if (s < 5) return "ahora";
  if (s < 60) return `hace ${Math.floor(s)} s`;
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  return new Date(ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export { MESES, DIAS };

/** Format an ISO date (yyyy-mm-dd) as "15 jul 2026". Returns "—" for falsy input. */
export function formatDate(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Day-of-month + short month, for the little calendar badge in list rows. */
export function dayBadge(isoDate) {
  if (!isoDate) return { dd: "—", mm: "" };
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { dd: "—", mm: "" };
  return { dd: String(d.getDate()), mm: MESES[d.getMonth()].toUpperCase() };
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Monday..Sunday ISO range of the current week. */
export function currentWeekRange() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // 0=Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { start: iso(monday), end: iso(sunday) };
}

export function isOverdue(activity) {
  if (!activity?.dueDate || activity.status === "done") return false;
  return activity.dueDate < todayISO();
}

/** hex (#RRGGBB) -> "r, g, b" for use inside rgba(). Falls back to a neutral blue. */
export function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return "76, 155, 240";
  return [m[1], m[2], m[3]].map((h) => parseInt(h, 16)).join(", ");
}

/** Inline style string for a "front" chip tinted with the front's color.
 *  Exposes the raw hex as the --fc custom property; .front derives the
 *  theme-aware text/border/background colors from it via color-mix(). */
export function frontChipStyle(hex) {
  return `--fc:${hex || "#7fc0ff"}`;
}

export function avatarStyle(hex) {
  return `background:${hex || "#4C9BF0"}`;
}

export function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Tiny helper to bind multiple [data-*] click handlers in one pass. */
export function on(root, selector, event, handler) {
  $$(selector, root).forEach((el) => el.addEventListener(event, handler));
}
