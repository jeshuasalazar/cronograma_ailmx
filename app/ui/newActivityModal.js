// Quick-add modal: dense form for creating a new activity in one shot
// (title, front, assignees, status, priority, dates, progress, estimated
// time, materials, optional initial note). Enter-to-save on the title
// field, minimal validation (title + front required).
import { createActivity, addNote } from "../repo/index.js";
import { invalidate } from "../store.js";
import { STATUS, PRIORITY } from "../repo/seedData.js";
import { escapeHtml, initials, avatarStyle } from "./format.js";
import { icon } from "./icons.js";
import { toastOk, toastError, friendlyError } from "./toast.js";

export function mountNewActivityModal(root, ctx) {
  root.innerHTML = `
    <div class="overlay" id="new-overlay">
      <div class="modal">
        <div class="mh"><h3>Nueva actividad</h3><button class="iconbtn" id="new-close">${icon("close", 16)}</button></div>
        <div class="mb" id="new-body"></div>
        <div class="mf">
          <button class="btn" id="new-cancel">Cancelar</button>
          <button class="btn pri" id="new-save">Guardar</button>
        </div>
      </div>
    </div>
  `;
  const overlay = root.querySelector("#new-overlay");
  const body = root.querySelector("#new-body");

  function fieldsHTML() {
    return `
      <div class="field"><label>Título de la actividad</label><input id="n-title" type="text" placeholder="Ej. Reunión con aliado estratégico" /></div>
      <div class="frow2">
        <div class="field"><label>Frente</label><select id="n-front">${ctx.getFronts().map((f) => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join("")}</select></div>
        <div class="field"><label>Estado</label><select id="n-status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === "todo" ? "selected" : ""}>${escapeHtml(v.label)}</option>`).join("")}</select></div>
      </div>
      <div class="field">
        <label>Responsables</label>
        <div class="assignee-toggles" id="n-assignees">
          ${ctx.getMembers().map((m) => `<button type="button" class="atoggle" data-a="${m.id}"><span class="ava" style="${avatarStyle(m.color)}">${initials(m.name)}</span>${escapeHtml(m.name)}</button>`).join("")}
        </div>
      </div>
      <div class="frow2">
        <div class="field"><label>Prioridad</label><select id="n-priority">${Object.entries(PRIORITY).map(([k, v]) => `<option value="${k}" ${k === "medium" ? "selected" : ""}>${escapeHtml(v.label)}</option>`).join("")}</select></div>
        <div class="field"><label>Avance inicial</label><input id="n-progress" type="number" min="0" max="100" step="5" value="0" /></div>
      </div>
      <div class="frow2">
        <div class="field"><label>Fecha inicio</label><input id="n-start" type="date" /></div>
        <div class="field"><label>Fecha límite</label><input id="n-due" type="date" /></div>
      </div>
      <div class="field"><label>Tareas principales / descripción</label><textarea id="n-desc" placeholder="Describe las tareas clave…"></textarea></div>
      <div class="frow2">
        <div class="field"><label>Tiempo estimado</label><input id="n-time" type="text" placeholder="Una semana" /></div>
        <div class="field"><label>Materiales necesarios</label><input id="n-mat" type="text" placeholder="Temario, documentos, etc." /></div>
      </div>
      <div class="field"><label>Nota inicial (opcional)</label><input id="n-note" type="text" placeholder="Primer avance o contexto…" /></div>
      <div id="n-error" style="display:none" class="gate-error"></div>
    `;
  }

  function open() {
    body.innerHTML = fieldsHTML();
    body.querySelectorAll("[data-a]").forEach((btn) => btn.addEventListener("click", () => btn.classList.toggle("on")));
    overlay.classList.add("show");
    setTimeout(() => body.querySelector("#n-title")?.focus(), 30);
    body.querySelector("#n-title").addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
    });
  }
  function close() {
    overlay.classList.remove("show");
  }

  async function save() {
    const title = body.querySelector("#n-title").value.trim();
    const errorBox = body.querySelector("#n-error");
    errorBox.style.display = "none";
    const front = body.querySelector("#n-front").value;
    if (!title || !front) {
      errorBox.textContent = "El título y el frente son obligatorios.";
      errorBox.style.display = "block";
      if (!title) body.querySelector("#n-title").focus();
      return;
    }
    const assignees = body.querySelectorAll("[data-a].on");
    const saveBtn = root.querySelector("#new-save");
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando…";
    try {
      const created = await createActivity({
        title,
        description: body.querySelector("#n-desc").value.trim(),
        front,
        assignees: [...assignees].map((b) => b.dataset.a),
        status: body.querySelector("#n-status").value,
        priority: body.querySelector("#n-priority").value,
        progress: +body.querySelector("#n-progress").value || 0,
        startDate: body.querySelector("#n-start").value || null,
        dueDate: body.querySelector("#n-due").value || null,
        estimatedTime: body.querySelector("#n-time").value.trim(),
        materials: body.querySelector("#n-mat").value.trim(),
        createdBy: ctx.me?.id,
      });
      const note = body.querySelector("#n-note").value.trim();
      if (note) await addNote(created.id, { body: note, authorId: ctx.me?.id });
      invalidate(["activities"]);
      toastOk("Actividad creada.");
      close();
    } catch (err) {
      errorBox.textContent = friendlyError(err);
      errorBox.style.display = "block";
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar";
    }
  }

  root.querySelector("#new-close").addEventListener("click", close);
  root.querySelector("#new-cancel").addEventListener("click", close);
  root.querySelector("#new-save").addEventListener("click", save);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  return { open, close };
}
