// Combinable filter bar: responsable, frente, estado, prioridad, texto,
// vencimiento. Filters (minus free text) persist to localStorage so the
// view survives a reload. Emits onChange(filters) on every change; the
// caller (activityList.js via main.js) rebuilds its query key from it.
import { STATUS, PRIORITY } from "../repo/seedData.js";
import { escapeHtml, debounce } from "./format.js";
import { icon } from "./icons.js";

const PREF_KEY = "ail_ops_ui_prefs_v1";
const DUE_OPTIONS = [
  ["", "Todas las fechas"],
  ["overdue", "Vencidas"],
  ["week", "Esta semana"],
  ["nodate", "Sin fecha"],
];

const DEFAULT_FILTERS = { q: "", front: "", status: "", priority: "", assignee: "", due: "" };

/** Always returns the full, consistently-shaped filters object (defaults
 * merged in) so every caller — activityList.js and filters.js itself —
 * builds identical cache keys from the same starting state. */
export function loadPersistedFilters() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREF_KEY));
    if (raw && typeof raw === "object") return { ...DEFAULT_FILTERS, ...raw };
  } catch {
    /* ignore corrupt prefs */
  }
  return { ...DEFAULT_FILTERS };
}

function persist(filters) {
  const { q, ...rest } = filters;
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(rest));
  } catch {
    /* storage full/unavailable — non-fatal */
  }
}

export function mountFilters(root, ctx, { initial = {}, onChange }) {
  let filters = {
    q: "",
    front: "",
    status: "",
    priority: "",
    assignee: "",
    due: "",
    ...initial,
  };

  function emit() {
    persist(filters);
    onChange({ ...filters });
  }

  function frontOptions() {
    return ctx.getFronts().map((f) => `<option value="${f.id}" ${filters.front === f.id ? "selected" : ""}>${escapeHtml(f.name)}</option>`).join("");
  }
  function assigneeOptions() {
    return ctx.getMembers().map((m) => `<option value="${m.id}" ${filters.assignee === m.id ? "selected" : ""}>${escapeHtml(m.name)}</option>`).join("");
  }

  function statusChips() {
    const items = [["", "Todos", ""], ...Object.entries(STATUS).map(([k, v]) => [k, v.label, `st-${k}`])];
    return items
      .map(([v, l, cls]) => `<button type="button" class="chip ${cls} ${filters.status === v ? "on" : ""}" data-status="${v}">${escapeHtml(l)}</button>`)
      .join("");
  }
  function priorityChips() {
    const items = [["", "Todas"], ...Object.entries(PRIORITY).map(([k, v]) => [k, v.label])];
    return items
      .map(([v, l]) => `<button type="button" class="chip ${filters.priority === v ? "on" : ""}" data-priority="${v}" style="${filters.priority === v && v ? `background:${PRIORITY[v].color};border-color:${PRIORITY[v].color};color:#06121f` : ""}">${escapeHtml(l)}</button>`)
      .join("");
  }

  function render() {
    root.innerHTML = `
      <div class="toolbar">
        <div class="search">
          ${icon("search", 15)}
          <input id="flt-q" type="text" placeholder="Buscar actividad, frente o responsable…" value="${escapeHtml(filters.q)}" />
        </div>
        <select class="selmini" id="flt-front"><option value="">Todos los frentes</option>${frontOptions()}</select>
        <select class="selmini" id="flt-assignee"><option value="">Todos los responsables</option>${assigneeOptions()}</select>
        <select class="selmini" id="flt-due">${DUE_OPTIONS.map(([v, l]) => `<option value="${v}" ${filters.due === v ? "selected" : ""}>${l}</option>`).join("")}</select>
        <button type="button" class="btn sm filters-toggle" id="flt-toggle">${icon("filter", 13)} Filtros</button>
      </div>
      <div class="filters-extra ${window.innerWidth <= 640 ? "collapsed" : ""}" id="flt-extra">
        <div class="chips" id="flt-status-chips">${statusChips()}</div>
        <div class="chips" id="flt-priority-chips">${priorityChips()}</div>
        <button type="button" class="filters-clear mono" id="flt-clear">Limpiar filtros</button>
      </div>
    `;

    root.querySelector("#flt-q").addEventListener(
      "input",
      debounce((e) => {
        filters.q = e.target.value;
        emit();
      }, 300),
    );
    root.querySelector("#flt-front").addEventListener("change", (e) => {
      filters.front = e.target.value;
      emit();
    });
    root.querySelector("#flt-assignee").addEventListener("change", (e) => {
      filters.assignee = e.target.value;
      emit();
    });
    root.querySelector("#flt-due").addEventListener("change", (e) => {
      filters.due = e.target.value;
      emit();
    });
    root.querySelectorAll("[data-status]").forEach((b) =>
      b.addEventListener("click", () => {
        filters.status = b.dataset.status;
        render();
        emit();
      }),
    );
    root.querySelectorAll("[data-priority]").forEach((b) =>
      b.addEventListener("click", () => {
        filters.priority = b.dataset.priority;
        render();
        emit();
      }),
    );
    root.querySelector("#flt-clear").addEventListener("click", () => {
      const q = filters.q;
      filters = { q, front: "", status: "", priority: "", assignee: "", due: "" };
      render();
      emit();
    });
    root.querySelector("#flt-toggle")?.addEventListener("click", () => {
      root.querySelector("#flt-extra").classList.toggle("collapsed");
    });
  }

  render();
  const unsubFronts = ctx.frontsQuery.subscribe(() => {
    root.querySelector("#flt-front") && render();
  });
  const unsubMembers = ctx.membersQuery.subscribe(() => {
    root.querySelector("#flt-assignee") && render();
  });

  return {
    getFilters: () => ({ ...filters }),
    destroy: () => {
      unsubFronts();
      unsubMembers();
    },
  };
}
