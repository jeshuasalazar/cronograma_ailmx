// Dense activity list: filters -> query -> rows with inline status/priority
// quick-actions, progress ring, overdue indicator, "cargar más" pagination.
//
// Pagination note: the repo interface only supports offset pagination
// (page/pageSize) server-side, and has no "due date IS NULL" or "not
// equal" filter. For the plain case (no due-filter, or "esta semana") we
// use normal server-side page/pageSize and grow pageSize on "cargar más".
// For "vencidas" (overdue) and "sin fecha" we fetch a generous page
// (500) and finish the filtering client-side (overdue also excludes
// status=done, which the API can't express directly), then paginate
// that filtered set in-memory. This keeps the repo interface untouched
// while still covering the two vencimiento views the spec asks for.
import { listActivities, updateActivity } from "../repo/index.js";
import { getQuery, mutate } from "../store.js";
import { STATUS, PRIORITY } from "../repo/seedData.js";
import {
  escapeHtml,
  initials,
  avatarStyle,
  frontChipStyle,
  dayBadge,
  formatDate,
  isOverdue,
  currentWeekRange,
} from "./format.js";
import { icon } from "./icons.js";
import { toastError, friendlyError } from "./toast.js";

const PAGE_SIZE_STEP = 50;

function buildRepoFilters(filters, pageSize) {
  const base = {};
  if (filters.status) base.status = filters.status;
  if (filters.priority) base.priority = filters.priority;
  if (filters.front) base.front = filters.front;
  if (filters.assignee) base.assignee = filters.assignee;
  if (filters.q?.trim()) base.q = filters.q.trim();

  if (filters.due === "week") {
    const { start, end } = currentWeekRange();
    base.dueAfter = start;
    base.dueBefore = end;
    return { mode: "server", params: { ...base, page: 1, pageSize } };
  }
  if (filters.due === "overdue" || filters.due === "nodate") {
    return { mode: "client", params: { ...base, page: 1, pageSize: 500 }, kind: filters.due };
  }
  return { mode: "server", params: { ...base, page: 1, pageSize } };
}

async function fetchList(filters, pageSize) {
  const built = buildRepoFilters(filters, pageSize);
  const res = await listActivities(built.params);
  if (built.mode === "server") return res;

  let items = res.items;
  if (built.kind === "overdue") items = items.filter((a) => isOverdue(a));
  else if (built.kind === "nodate") items = items.filter((a) => !a.dueDate);

  return { items: items.slice(0, pageSize), total: items.length, page: 1, pageSize };
}

function statusPopHTML(activityId) {
  return `<div class="pop" id="pop-status-${activityId}">${Object.entries(STATUS)
    .map(([k, v]) => `<button data-set-status="${activityId}|${k}"><span class="d" style="background:${v.color}"></span>${v.label}</button>`)
    .join("")}</div>`;
}
function priorityPopHTML(activityId) {
  return `<div class="pop" id="pop-priority-${activityId}">${Object.entries(PRIORITY)
    .map(([k, v]) => `<button data-set-priority="${activityId}|${k}"><span class="d" style="background:${v.color}"></span>${v.label}</button>`)
    .join("")}</div>`;
}

function skeletonRows() {
  return Array.from({ length: 5 }).map(() => `<div class="sk sk-row"></div>`).join("");
}

export function mountActivityList(root, ctx, { filters, countEl }) {
  let currentFilters = filters;
  let pageSize = PAGE_SIZE_STEP;
  let query = getQuery(`activities:list:${JSON.stringify({ ...currentFilters, pageSize })}`, () => fetchList(currentFilters, pageSize));
  let unsub = null;

  function ownerHTML(id) {
    const m = ctx.getMembers().find((x) => x.id === id);
    if (!m) return "";
    return `<span class="owner"><span class="ava" style="${avatarStyle(m.color)}">${initials(m.name)}</span>${escapeHtml(m.name)}</span>`;
  }
  function frontHTML(frontId) {
    const f = ctx.getFronts().find((x) => x.id === frontId);
    if (!f) return "";
    return `<span class="front" style="${frontChipStyle(f.color)}">${escapeHtml(f.name)}</span>`;
  }

  function rowHTML(a) {
    const st = STATUS[a.status] || STATUS.todo;
    const pr = PRIORITY[a.priority] || PRIORITY.medium;
    const db = dayBadge(a.dueDate || a.startDate);
    const overdue = isOverdue(a);
    return `<div class="task ${overdue ? "overdue" : ""}" data-row="${a.id}">
      <div class="task-row" data-toggle="${a.id}">
        <div class="daybadge"><span class="dd">${db.dd}</span><span class="mm">${db.mm}</span></div>
        <div class="t-main">
          <div class="t-title">${escapeHtml(a.title)}${overdue ? `<span class="overdue-tag">${icon("alert", 11)} Vencida</span>` : ""}</div>
          <div class="t-meta">
            ${frontHTML(a.front)}
            ${a.assignees.map(ownerHTML).join("")}
            <div style="position:relative">
              <button type="button" class="prio-tag" data-prio="${a.id}" style="color:${pr.color};border-color:${pr.color}66;cursor:pointer">${pr.label}</button>
              ${priorityPopHTML(a.id)}
            </div>
            <span class="datetag">${a.dueDate ? `vence ${formatDate(a.dueDate)}` : "sin fecha"}</span>
          </div>
        </div>
        <div class="t-right">
          <div class="ring" style="--p:${a.progress};--rc:${st.color}"><span>${a.progress}</span></div>
          <div style="position:relative">
            <button class="stat ${st.cls || `s-${a.status}`}" data-stat="${a.id}"><span class="d"></span>${st.label}${icon("chevronDown", 11, 'class="caret"')}</button>
            ${statusPopHTML(a.id)}
          </div>
        </div>
      </div>
    </div>`;
  }

  function bind() {
    root.querySelectorAll("[data-toggle]").forEach((el) =>
      el.addEventListener("click", (e) => {
        if (e.target.closest(".stat") || e.target.closest(".pop") || e.target.closest("[data-prio]")) return;
        ctx.openDetail(el.dataset.toggle);
      }),
    );
    root.querySelectorAll("[data-prio]").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const pop = root.querySelector(`#pop-priority-${b.dataset.prio}`);
        const wasOpen = pop.classList.contains("show");
        root.querySelectorAll(".pop").forEach((p) => p.classList.remove("show"));
        if (!wasOpen) pop.classList.add("show");
      }),
    );
    root.querySelectorAll("[data-set-priority]").forEach((b) =>
      b.addEventListener("click", async (e) => {
        e.stopPropagation();
        const [id, priority] = b.dataset.setPriority.split("|");
        root.querySelectorAll(".pop").forEach((p) => p.classList.remove("show"));
        await changePriority(id, priority);
      }),
    );
    root.querySelectorAll("[data-stat]").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const pop = root.querySelector(`#pop-status-${b.dataset.stat}`);
        const wasOpen = pop.classList.contains("show");
        root.querySelectorAll(".pop").forEach((p) => p.classList.remove("show"));
        if (!wasOpen) pop.classList.add("show");
      }),
    );
    root.querySelectorAll("[data-set-status]").forEach((b) =>
      b.addEventListener("click", async (e) => {
        e.stopPropagation();
        const [id, status] = b.dataset.setStatus.split("|");
        root.querySelectorAll(".pop").forEach((p) => p.classList.remove("show"));
        await changeStatus(id, status);
      }),
    );
  }

  async function changeStatus(id, status) {
    try {
      await mutate(() => updateActivity(id, { status }, { actorId: ctx.me?.id }), {
        optimistic: {
          [query.key]: (prev) => (prev ? { ...prev, items: prev.items.map((a) => (a.id === id ? { ...a, status, progress: status === "done" ? 100 : status === "todo" ? 0 : a.progress } : a)) } : prev),
          [`activities:detail:${id}`]: (prev) => (prev ? { ...prev, status } : prev),
        },
        invalidates: ["activities"],
      });
    } catch (err) {
      toastError(friendlyError(err));
    }
  }

  async function changePriority(id, priority) {
    try {
      await mutate(() => updateActivity(id, { priority }, { actorId: ctx.me?.id }), {
        optimistic: {
          [query.key]: (prev) => (prev ? { ...prev, items: prev.items.map((a) => (a.id === id ? { ...a, priority } : a)) } : prev),
          [`activities:detail:${id}`]: (prev) => (prev ? { ...prev, priority } : prev),
        },
        invalidates: ["activities"],
      });
    } catch (err) {
      toastError(friendlyError(err));
    }
  }

  function renderState(state) {
    if (state.status === "loading" || state.status === "idle") {
      if (countEl) countEl.textContent = "Cargando…";
      root.querySelector("#board").innerHTML = skeletonRows();
      root.querySelector("#load-more-wrap").innerHTML = "";
      return;
    }
    if (state.status === "error") {
      if (countEl) countEl.textContent = "";
      root.querySelector("#board").innerHTML = `<div class="error-state">
        No se pudieron cargar las actividades: ${escapeHtml(state.error?.message || String(state.error))}
        <button class="btn sm" id="list-retry">Reintentar</button>
      </div>`;
      root.querySelector("#list-retry").addEventListener("click", () => query.refetch());
      root.querySelector("#load-more-wrap").innerHTML = "";
      return;
    }
    const { items, total } = state.data;
    if (countEl) countEl.textContent = `${items.length} de ${total}${state.optimistic ? " · guardando…" : ""}`;
    const board = root.querySelector("#board");
    if (!items.length) {
      board.innerHTML = `<div class="empty-state">Sin actividades para este filtro.</div>`;
    } else {
      board.innerHTML = items.map(rowHTML).join("");
      bind();
    }
    const loadMoreWrap = root.querySelector("#load-more-wrap");
    if (items.length < total) {
      loadMoreWrap.innerHTML = `<button class="btn" id="load-more">Cargar más (${total - items.length} restantes)</button>`;
      loadMoreWrap.querySelector("#load-more").addEventListener("click", () => {
        pageSize += PAGE_SIZE_STEP;
        rebuildQuery();
      });
    } else {
      loadMoreWrap.innerHTML = "";
    }
  }

  function rebuildQuery() {
    unsub?.();
    query = getQuery(`activities:list:${JSON.stringify({ ...currentFilters, pageSize })}`, () => fetchList(currentFilters, pageSize));
    unsub = query.subscribe(renderState);
  }

  root.innerHTML = `
    <div class="board" id="board">${skeletonRows()}</div>
    <div class="load-more-wrap" id="load-more-wrap"></div>
  `;
  unsub = query.subscribe(renderState);

  return {
    setFilters(next) {
      currentFilters = next;
      pageSize = PAGE_SIZE_STEP;
      rebuildQuery();
    },
    destroy: () => unsub?.(),
  };
}
