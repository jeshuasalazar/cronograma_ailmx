// Minimal toast/notification stack, mounted once at boot (see main.js).
// Used for mutation feedback: "Guardando…", "Sincronizado", RLS errors, etc.
import { escapeHtml } from "./format.js";

let host = null;

function ensureHost() {
  if (host && document.body.contains(host)) return host;
  host = document.createElement("div");
  host.className = "toast-host";
  document.body.appendChild(host);
  return host;
}

/**
 * @param {string} message
 * @param {{type?: 'info'|'success'|'error', timeout?: number}} [opts]
 */
export function toast(message, opts = {}) {
  const { type = "info", timeout = 4200 } = opts;
  const h = ensureHost();
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-msg">${escapeHtml(message)}</span>`;
  h.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  const remove = () => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 220);
  };
  if (timeout) setTimeout(remove, timeout);
  el.addEventListener("click", remove);
  return remove;
}

export const toastError = (msg) => toast(msg, { type: "error", timeout: 6000 });
export const toastOk = (msg) => toast(msg, { type: "success" });

/** Friendly-ify common Supabase RLS / auth error messages for Spanish UI copy. */
export function friendlyError(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  if (msg.includes("row-level security") || msg.includes("permission denied") || msg.includes("rls")) {
    return "No tienes permisos para esta acción (solo administradores). Contacta al admin del equipo.";
  }
  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network request failed")) {
    return "Sin conexión. Revisa tu internet e intenta de nuevo.";
  }
  if (msg.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  return error?.message || String(error) || "Ocurrió un error inesperado.";
}
