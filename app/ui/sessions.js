// "Próximas sesiones" sidebar panel — upcoming Zoom/manual sessions with
// a "Unirse" link and, for admins, inline create/edit/delete. Mirrors the
// getQuery/mutate + modal patterns used by team.js/fronts.js and
// newActivityModal.js respectively, but keeps its own tiny create/edit
// modal (appended to <body>, like toast.js's host) instead of a dedicated
// shell slot, since only sessions.js/main.js/styles.css are in scope here.
import { getQuery, mutate } from "../store.js";
import { listSessions, createSession, updateSession, deleteSession } from "../repo/index.js";
import { escapeHtml, dayBadge } from "./format.js";
import { toastOk, toastError, friendlyError } from "./toast.js";
import { icon } from "./icons.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toLocalDateInput(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function toLocalTimeInput(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function mountSessions(root, countEl, ctx) {
  const sessionsQuery = getQuery("sessions", () => listSessions());
  let editingId = null;

  // ---- one-off create/edit modal, appended to <body> ------------------
  const modalHost = document.createElement("div");
  document.body.appendChild(modalHost);
  modalHost.innerHTML = `
    <div class="overlay" id="sess-overlay">
      <div class="modal">
        <div class="mh"><h3 id="sess-modal-title">Nueva sesión</h3><button class="iconbtn" id="sess-modal-close">${icon("close", 16)}</button></div>
        <div class="mb" id="sess-modal-body">
          <div class="field"><label>Título</label><input id="s-title" type="text" placeholder="Ej. Sesión de mentoría" /></div>
          <div class="frow2">
            <div class="field"><label>Fecha</label><input id="s-date" type="date" /></div>
            <div class="field"><label>Hora</label><input id="s-time" type="time" /></div>
          </div>
          <div class="frow2">
            <div class="field"><label>Duración (min)</label><input id="s-duration" type="number" min="1" step="5" value="60" /></div>
            <div class="field"><label>Host</label><input id="s-host" type="text" placeholder="Nombre del anfitrión" /></div>
          </div>
          <div class="field"><label>Link de Zoom</label><input id="s-joinurl" type="url" placeholder="https://zoom.us/j/…" /></div>
          <div class="field"><label>Descripción</label><textarea id="s-desc" placeholder="Detalles de la sesión…"></textarea></div>
          <div id="sess-error" style="display:none" class="gate-error"></div>
        </div>
        <div class="mf">
          <button class="btn" id="sess-modal-cancel">Cancelar</button>
          <button class="btn pri" id="sess-modal-save">Guardar</button>
        </div>
      </div>
    </div>
  `;
  const overlay = modalHost.querySelector("#sess-overlay");
  const modalBody = modalHost.querySelector("#sess-modal-body");
  const errorBox = modalHost.querySelector("#sess-error");

  function openModal(session) {
    editingId = session?.id || null;
    modalHost.querySelector("#sess-modal-title").textContent = editingId ? "Editar sesión" : "Nueva sesión";
    const d = session?.startsAt ? new Date(session.startsAt) : null;
    modalBody.querySelector("#s-title").value = session?.title || "";
    modalBody.querySelector("#s-date").value = d ? toLocalDateInput(d) : "";
    modalBody.querySelector("#s-time").value = d ? toLocalTimeInput(d) : "";
    modalBody.querySelector("#s-duration").value = session?.durationMin || 60;
    modalBody.querySelector("#s-host").value = session?.host || "";
    modalBody.querySelector("#s-joinurl").value = session?.joinUrl || "";
    modalBody.querySelector("#s-desc").value = session?.description || "";
    errorBox.style.display = "none";
    overlay.classList.add("show");
    setTimeout(() => modalBody.querySelector("#s-title")?.focus(), 30);
  }
  function closeModal() {
    overlay.classList.remove("show");
    editingId = null;
  }

  async function save() {
    const title = modalBody.querySelector("#s-title").value.trim();
    const date = modalBody.querySelector("#s-date").value;
    const time = modalBody.querySelector("#s-time").value;
    errorBox.style.display = "none";
    if (!title || !date || !time) {
      errorBox.textContent = "El título, la fecha y la hora son obligatorios.";
      errorBox.style.display = "block";
      return;
    }
    const startsAt = new Date(`${date}T${time}`).toISOString();
    const durationMin = +modalBody.querySelector("#s-duration").value || 60;
    const joinUrl = modalBody.querySelector("#s-joinurl").value.trim();
    const host = modalBody.querySelector("#s-host").value.trim();
    const description = modalBody.querySelector("#s-desc").value.trim();

    const saveBtn = modalHost.querySelector("#sess-modal-save");
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando…";
    try {
      if (editingId) {
        await mutate(() => updateSession(editingId, { title, startsAt, durationMin, joinUrl, host, description }), { invalidates: ["sessions"] });
        toastOk("Sesión actualizada.");
      } else {
        await mutate(() => createSession({ title, startsAt, durationMin, joinUrl, host, description, source: "manual", createdBy: ctx.me?.id }), {
          invalidates: ["sessions"],
        });
        toastOk("Sesión creada.");
      }
      closeModal();
    } catch (err) {
      errorBox.textContent = friendlyError(err);
      errorBox.style.display = "block";
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar";
    }
  }

  modalHost.querySelector("#sess-modal-close").addEventListener("click", closeModal);
  modalHost.querySelector("#sess-modal-cancel").addEventListener("click", closeModal);
  modalHost.querySelector("#sess-modal-save").addEventListener("click", save);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  function onKeydown(e) {
    if (e.key === "Escape" && overlay.classList.contains("show")) closeModal();
  }
  document.addEventListener("keydown", onKeydown);

  // ---- list -------------------------------------------------------------
  async function onDelete(s) {
    if (!confirm(`¿Eliminar la sesión "${s.title}"?`)) return;
    try {
      await mutate(() => deleteSession(s.id), { invalidates: ["sessions"] });
      toastOk("Sesión eliminada.");
    } catch (err) {
      toastError(friendlyError(err));
    }
  }

  function rowHTML(s) {
    const dateOnly = String(s.startsAt || "").slice(0, 10);
    const db = dayBadge(dateOnly);
    const startMs = new Date(s.startsAt).getTime();
    const durationMin = s.durationMin || 60;
    const endMs = startMs + durationMin * 60000;
    const now = Date.now();
    const isLive = Number.isFinite(startMs) && now >= startMs && now <= endMs;
    const time = Number.isFinite(startMs) ? new Date(s.startsAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "—";

    const metaBits = [];
    if (s.host) metaBits.push(escapeHtml(s.host));
    metaBits.push(`${durationMin} min`);

    const joinBtn =
      typeof s.joinUrl === "string" && s.joinUrl.startsWith("https://")
        ? `<a class="btn sm pri sess-join" href="${escapeHtml(s.joinUrl)}" target="_blank" rel="noopener noreferrer">Unirse</a>`
        : "";
    const adminBtns = ctx.me?.isAdmin
      ? `<button class="iconbtn" data-edit-sess="${s.id}" title="Editar">${icon("edit", 13)}</button><button class="iconbtn" data-del-sess="${s.id}" title="Eliminar">${icon("trash", 13)}</button>`
      : "";

    return `<div class="sess-item" data-sess="${s.id}">
      <div class="daybadge"><span class="dd">${db.dd}</span><span class="mm">${db.mm}</span></div>
      <div class="sess-main">
        <div class="sess-title">${escapeHtml(s.title)}${isLive ? `<span class="sess-live">EN VIVO</span>` : ""}</div>
        <div class="sess-meta">${time}${metaBits.length ? " · " + metaBits.join(" · ") : ""}</div>
      </div>
      <div class="sess-actions">${joinBtn}${adminBtns}</div>
    </div>`;
  }

  function addBtnHTML() {
    return ctx.me?.isAdmin ? `<button type="button" class="btn sm block" id="sess-add" style="margin-bottom:10px">${icon("plus", 13)} Nueva sesión</button>` : "";
  }

  function bind(sessions) {
    root.querySelector("#sess-add")?.addEventListener("click", () => openModal(null));
    root.querySelectorAll("[data-edit-sess]").forEach((b) =>
      b.addEventListener("click", () => openModal(sessions.find((s) => s.id === b.dataset.editSess))),
    );
    root.querySelectorAll("[data-del-sess]").forEach((b) =>
      b.addEventListener("click", () => {
        const s = sessions.find((x) => x.id === b.dataset.delSess);
        if (s) onDelete(s);
      }),
    );
  }

  function render() {
    const state = sessionsQuery.getState();

    if (state.status === "loading" || state.status === "idle") {
      root.innerHTML = `${addBtnHTML()}<div class="sk sk-row"></div><div class="sk sk-row"></div>`;
      if (countEl) countEl.textContent = "";
      bind([]);
      return;
    }
    if (state.status === "error") {
      root.innerHTML = `${addBtnHTML()}<div class="error-state">Error al cargar sesiones. <button class="btn sm" id="sess-retry">Reintentar</button></div>`;
      if (countEl) countEl.textContent = "";
      bind([]);
      root.querySelector("#sess-retry")?.addEventListener("click", () => sessionsQuery.refetch());
      return;
    }

    const sessions = state.data || [];
    if (countEl) countEl.textContent = `${sessions.length} sesión${sessions.length !== 1 ? "es" : ""}`;
    if (!sessions.length) {
      root.innerHTML = `${addBtnHTML()}<div class="empty-state">No hay sesiones próximas.</div>`;
      bind(sessions);
      return;
    }
    root.innerHTML = addBtnHTML() + sessions.map(rowHTML).join("");
    bind(sessions);
  }

  render();
  const unsub = sessionsQuery.subscribe(render);
  return () => {
    unsub();
    document.removeEventListener("keydown", onKeydown);
    modalHost.remove();
  };
}
