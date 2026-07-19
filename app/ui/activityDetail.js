// Activity detail drawer: full editable form, multi-assignee toggle,
// progress slider, notes (add + paginated reveal), event history
// ("cargar más"), duplicate, delete (with RLS-aware error handling).
//
// Optimistic (per spec): status, priority, assignees, notes. Everything
// else (title/description/dates/materials/progress/delete/duplicate)
// waits for the server round-trip and shows an explicit saving/error
// state instead — deliberately not optimistic, per the task's "SOLO"
// restriction.
import { getActivity, updateActivity, setActivityAssignees, addNote, deleteActivity, createActivity, listEvents } from "../repo/index.js";
import { getQuery, mutate, invalidate } from "../store.js";
import { STATUS, PRIORITY } from "../repo/seedData.js";
import { escapeHtml, initials, avatarStyle, relTime, debounce } from "./format.js";
import { icon } from "./icons.js";
import { toastError, toastOk, friendlyError } from "./toast.js";

const NOTES_PAGE = 5;

export function mountActivityDetail(root, ctx) {
  root.innerHTML = `
    <div class="drawer-overlay" id="drawer-overlay"></div>
    <div class="drawer" id="drawer">
      <div class="drawer-head">
        <h3 id="drawer-title">Actividad</h3>
        <button class="iconbtn" id="drawer-close">${icon("close", 16)}</button>
      </div>
      <div class="drawer-body" id="drawer-body"></div>
      <div class="drawer-foot" id="drawer-foot"></div>
    </div>
  `;

  const overlay = root.querySelector("#drawer-overlay");
  const drawer = root.querySelector("#drawer");
  const body = root.querySelector("#drawer-body");
  const foot = root.querySelector("#drawer-foot");
  const titleEl = root.querySelector("#drawer-title");

  let currentId = null;
  let unsubQuery = null;
  let notesVisible = NOTES_PAGE;
  let eventsLimit = 8;
  let eventsUnsub = null;

  function close() {
    drawer.classList.remove("show");
    overlay.classList.remove("show");
    unsubQuery?.();
    eventsUnsub?.();
    currentId = null;
    document.body.style.overflow = "";
  }

  function open(id) {
    currentId = id;
    notesVisible = NOTES_PAGE;
    eventsLimit = 8;
    drawer.classList.add("show");
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
    unsubQuery?.();
    const q = getQuery(`activities:detail:${id}`, () => getActivity(id));
    unsubQuery = q.subscribe((state) => renderDetail(id, q, state));
  }

  overlay.addEventListener("click", close);
  root.querySelector("#drawer-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("show")) close();
  });

  function saveField(id, patch, opts = {}) {
    return mutate(() => updateActivity(id, patch, { actorId: ctx.me?.id }), {
      invalidates: ["activities"],
      ...opts,
    });
  }

  function assigneesHTML(activity) {
    return ctx
      .getMembers()
      .map((m) => {
        const on = activity.assignees.includes(m.id);
        return `<button type="button" class="atoggle ${on ? "on" : ""}" data-toggle-assignee="${m.id}">
          <span class="ava" style="${avatarStyle(m.color)}">${initials(m.name)}</span>${escapeHtml(m.name)}
        </button>`;
      })
      .join("");
  }

  function frontSelectHTML(activity) {
    return ctx.getFronts().map((f) => `<option value="${f.id}" ${activity.front === f.id ? "selected" : ""}>${escapeHtml(f.name)}</option>`).join("");
  }

  function statusSelectHTML(activity) {
    return Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${activity.status === k ? "selected" : ""}>${escapeHtml(v.label)}</option>`).join("");
  }
  function prioritySelectHTML(activity) {
    return Object.entries(PRIORITY).map(([k, v]) => `<option value="${k}" ${activity.priority === k ? "selected" : ""}>${escapeHtml(v.label)}</option>`).join("");
  }

  function notesHTML(activity) {
    const sorted = [...activity.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const shown = sorted.slice(0, notesVisible);
    if (!shown.length) return `<div class="fv" style="color:var(--mute)">Sin notas todavía.</div>`;
    const rows = shown
      .map((n) => {
        const author = ctx.getMembers().find((m) => m.id === n.authorId);
        return `<div class="note"><span class="nb">${relTime(n.createdAt)} · ${escapeHtml(author?.name || "—")}</span><span class="nt">${escapeHtml(n.body)}</span></div>`;
      })
      .join("");
    const more = sorted.length > shown.length ? `<button class="btn sm" id="notes-more" style="align-self:flex-start;margin-top:6px">Cargar más notas (${sorted.length - shown.length})</button>` : "";
    return rows + more;
  }

  function eventsHTML(events, hasMore) {
    if (!events.length) return `<div class="fv" style="color:var(--mute)">Sin eventos.</div>`;
    const rows = events
      .map((e) => `<div class="history-item"><span class="nb mono" style="white-space:nowrap;color:var(--mute);font-size:9px">${relTime(e.createdAt)}</span><span class="nt" style="font-size:12px">${describeEvent(e)}</span></div>`)
      .join("");
    const more = hasMore ? `<button class="btn sm" id="events-more" style="margin-top:8px">Cargar más eventos</button>` : "";
    return rows + more;
  }

  function describeEvent(e) {
    const who = escapeHtml(e.actorName || "Alguien");
    switch (e.kind) {
      case "created":
        return `${who} creó la actividad.`;
      case "status_changed":
        return `${who} cambió el estado a <b>${escapeHtml(STATUS[e.payload?.status]?.label || e.payload?.status)}</b>.`;
      case "progress_changed":
        return `${who} actualizó el avance a <b>${e.payload?.progress ?? "?"}%</b>.`;
      case "note_added":
        return `${who} agregó una nota.`;
      case "updated":
        return `${who} actualizó la actividad.`;
      default:
        return `${who}: ${escapeHtml(e.kind)}${e.payload?.text ? ` — ${escapeHtml(e.payload.text)}` : ""}`;
    }
  }

  function renderDetail(id, query, state) {
    if (id !== currentId) return;

    if (state.status === "loading" || state.status === "idle") {
      titleEl.textContent = "Cargando…";
      body.innerHTML = `<div class="sk sk-row" style="height:120px"></div><div class="sk sk-row"></div><div class="sk sk-row"></div>`;
      foot.innerHTML = "";
      return;
    }
    if (state.status === "error") {
      titleEl.textContent = "Error";
      body.innerHTML = `<div class="error-state">No se pudo cargar la actividad: ${escapeHtml(state.error?.message || String(state.error))}
        <button class="btn sm" id="detail-retry">Reintentar</button></div>`;
      body.querySelector("#detail-retry").addEventListener("click", () => query.refetch());
      foot.innerHTML = "";
      return;
    }
    const activity = state.data;
    if (!activity) {
      titleEl.textContent = "No encontrada";
      body.innerHTML = `<div class="empty-state">Esta actividad ya no existe (pudo ser eliminada).</div>`;
      foot.innerHTML = "";
      return;
    }

    titleEl.textContent = activity.title;
    const saving = state.optimistic ? `<span class="save-state saving">${icon("clock", 11)} guardando…</span>` : `<span class="save-state ok">${icon("check", 11)} sincronizado</span>`;

    body.innerHTML = `
      <div class="dfield">
        <div class="fl">Título</div>
        <input id="d-title" type="text" value="${escapeHtml(activity.title)}" />
      </div>
      <div class="dfield">
        <div class="fl">Descripción / tareas principales</div>
        <textarea id="d-desc" rows="3">${escapeHtml(activity.description)}</textarea>
      </div>
      <div class="dgrid">
        <div class="dfield"><div class="fl">Frente</div><select id="d-front">${frontSelectHTML(activity)}</select></div>
        <div class="dfield"><div class="fl">Estado</div><select id="d-status">${statusSelectHTML(activity)}</select></div>
      </div>
      <div class="dgrid">
        <div class="dfield"><div class="fl">Prioridad</div><select id="d-priority">${prioritySelectHTML(activity)}</select></div>
        <div class="dfield"><div class="fl">Tiempo estimado</div><input id="d-time" type="text" value="${escapeHtml(activity.estimatedTime)}" /></div>
      </div>
      <div class="dgrid">
        <div class="dfield"><div class="fl">Fecha inicio</div><input id="d-start" type="date" value="${activity.startDate || ""}" /></div>
        <div class="dfield"><div class="fl">Fecha límite</div><input id="d-due" type="date" value="${activity.dueDate || ""}" /></div>
      </div>
      <div class="dfield">
        <div class="fl">Materiales</div>
        <input id="d-materials" type="text" value="${escapeHtml(activity.materials)}" />
      </div>
      <div class="dfield">
        <div class="fl">Responsables</div>
        <div class="assignee-toggles" id="d-assignees">${assigneesHTML(activity)}</div>
      </div>
      <div class="dfield">
        <div class="fl">Avance — ${activity.progress}%</div>
        <div class="prog-edit"><input type="range" min="0" max="100" step="5" value="${activity.progress}" id="d-progress" /><span class="pv" id="d-progress-val">${activity.progress}%</span></div>
      </div>
      <div class="dfield">
        <div class="fl">Notas de seguimiento</div>
        <div class="notes" id="d-notes">${notesHTML(activity)}</div>
        <div class="addnote"><input type="text" id="d-note-input" placeholder="Añadir nota de seguimiento…" /><button class="btn pri" id="d-note-add">Añadir</button></div>
      </div>
      <div class="dfield">
        <div class="fl">Historial de eventos</div>
        <div id="d-events"><div class="sk sk-row" style="height:40px"></div></div>
      </div>
      <div style="display:flex;justify-content:flex-end">${saving}</div>
    `;

    foot.innerHTML = `
      <button class="btn" id="d-duplicate">${icon("copy", 14)} Duplicar</button>
      <button class="btn danger" id="d-delete" style="margin-right:auto">${icon("trash", 14)} Eliminar</button>
      <button class="btn" id="d-close2">Cerrar</button>
    `;

    bindDetail(activity, query);
    loadEvents(activity.id);
  }

  function bindDetail(activity, query) {
    const id = activity.id;
    const debouncedTextSave = debounce((patch) => saveField(id, patch).catch((e) => toastError(friendlyError(e))), 500);

    body.querySelector("#d-title").addEventListener("input", (e) => debouncedTextSave({ title: e.target.value }));
    body.querySelector("#d-desc").addEventListener("input", (e) => debouncedTextSave({ description: e.target.value }));
    body.querySelector("#d-time").addEventListener("input", (e) => debouncedTextSave({ estimatedTime: e.target.value }));
    body.querySelector("#d-materials").addEventListener("input", (e) => debouncedTextSave({ materials: e.target.value }));
    body.querySelector("#d-start").addEventListener("change", (e) => saveField(id, { startDate: e.target.value || null }).catch((err) => toastError(friendlyError(err))));
    body.querySelector("#d-due").addEventListener("change", (e) => saveField(id, { dueDate: e.target.value || null }).catch((err) => toastError(friendlyError(err))));

    body.querySelector("#d-front").addEventListener("change", (e) => saveField(id, { front: e.target.value }).catch((err) => toastError(friendlyError(err))));

    body.querySelector("#d-status").addEventListener("change", async (e) => {
      const status = e.target.value;
      try {
        await mutate(() => updateActivity(id, { status }, { actorId: ctx.me?.id }), {
          optimistic: { [`activities:detail:${id}`]: (prev) => (prev ? { ...prev, status } : prev) },
          invalidates: ["activities"],
        });
      } catch (err) {
        toastError(friendlyError(err));
      }
    });
    body.querySelector("#d-priority").addEventListener("change", async (e) => {
      const priority = e.target.value;
      try {
        await mutate(() => updateActivity(id, { priority }, { actorId: ctx.me?.id }), {
          optimistic: { [`activities:detail:${id}`]: (prev) => (prev ? { ...prev, priority } : prev) },
          invalidates: ["activities"],
        });
      } catch (err) {
        toastError(friendlyError(err));
      }
    });

    body.querySelectorAll("[data-toggle-assignee]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const memberId = btn.dataset.toggleAssignee;
        const next = activity.assignees.includes(memberId) ? activity.assignees.filter((a) => a !== memberId) : [...activity.assignees, memberId];
        try {
          await mutate(() => setActivityAssignees(id, next), {
            optimistic: { [`activities:detail:${id}`]: (prev) => (prev ? { ...prev, assignees: next } : prev) },
            invalidates: ["activities"],
          });
        } catch (err) {
          toastError(friendlyError(err));
        }
      }),
    );

    const progressInput = body.querySelector("#d-progress");
    const progressVal = body.querySelector("#d-progress-val");
    progressInput.addEventListener("input", (e) => (progressVal.textContent = `${e.target.value}%`));
    progressInput.addEventListener("change", async (e) => {
      try {
        await saveField(id, { progress: +e.target.value });
      } catch (err) {
        toastError(friendlyError(err));
      }
    });

    function bindNotesMore() {
      body.querySelector("#notes-more")?.addEventListener("click", () => {
        notesVisible += NOTES_PAGE;
        body.querySelector("#d-notes").innerHTML = notesHTML(activity);
        bindNotesMore();
      });
    }
    bindNotesMore();

    async function submitNote() {
      const input = body.querySelector("#d-note-input");
      const value = input.value.trim();
      if (!value) return;
      input.value = "";
      try {
        await mutate(() => addNote(id, { body: value, authorId: ctx.me?.id }), {
          optimistic: {
            [`activities:detail:${id}`]: (prev) =>
              prev ? { ...prev, notes: [...prev.notes, { id: `tmp-${Date.now()}`, body: value, authorId: ctx.me?.id, createdAt: new Date().toISOString() }] } : prev,
          },
          invalidates: ["activities", "notes"],
        });
      } catch (err) {
        toastError(friendlyError(err));
      }
    }
    body.querySelector("#d-note-add").addEventListener("click", submitNote);
    body.querySelector("#d-note-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitNote();
    });

    foot.querySelector("#d-close2").addEventListener("click", close);
    foot.querySelector("#d-duplicate").addEventListener("click", () => duplicate(activity));
    foot.querySelector("#d-delete").addEventListener("click", () => remove(activity));
  }

  async function loadEvents(activityId) {
    eventsUnsub?.();
    const q = getQuery(`activities:events:${activityId}:${eventsLimit}`, () => listEvents({ activityId, limit: eventsLimit }));
    eventsUnsub = q.subscribe((state) => {
      if (currentId !== activityId) return;
      const el = body.querySelector("#d-events");
      if (!el) return;
      if (state.status === "loading" || state.status === "idle") {
        el.innerHTML = `<div class="sk sk-row" style="height:40px"></div>`;
        return;
      }
      if (state.status === "error") {
        el.innerHTML = `<div class="error-state" style="padding:10px 0">Error al cargar eventos.</div>`;
        return;
      }
      const hasMore = state.data.length >= eventsLimit;
      el.innerHTML = eventsHTML(state.data, hasMore);
      el.querySelector("#events-more")?.addEventListener("click", () => {
        eventsLimit += 10;
        loadEvents(activityId);
      });
    });
  }

  async function duplicate(activity) {
    try {
      const created = await createActivity({
        title: `${activity.title} (copia)`,
        description: activity.description,
        front: activity.front,
        assignees: activity.assignees,
        status: "todo",
        priority: activity.priority,
        progress: 0,
        startDate: activity.startDate,
        dueDate: activity.dueDate,
        estimatedTime: activity.estimatedTime,
        materials: activity.materials,
        createdBy: ctx.me?.id,
      });
      invalidate(["activities"]);
      toastOk("Actividad duplicada.");
      open(created.id);
    } catch (err) {
      toastError(friendlyError(err));
    }
  }

  async function remove(activity) {
    if (!confirm(`¿Eliminar "${activity.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteActivity(activity.id);
      invalidate(["activities"]);
      toastOk("Actividad eliminada.");
      close();
    } catch (err) {
      toastError(friendlyError(err));
    }
  }

  return { open, close };
}
