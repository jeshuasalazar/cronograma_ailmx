// Team & fronts admin modal (tabs). CRUD against team_members/fronts.
// Per the RLS policies (supabase/migrations/003_rls.sql), only admins can
// write here — any non-admin write attempt surfaces as a friendly error
// via friendlyError() rather than a raw Postgres message.
import { listMembers, createMember, updateMember, deleteMember, listFronts, createFront, updateFront, deleteFront } from "../repo/index.js";
import { getQuery, invalidate } from "../store.js";
import { escapeHtml } from "./format.js";
import { icon } from "./icons.js";
import { toastOk, toastError, friendlyError } from "./toast.js";

export function mountTeamAdmin(root, ctx) {
  root.innerHTML = `
    <div class="overlay" id="team-overlay">
      <div class="modal wide">
        <div class="mh"><h3>Equipo y frentes</h3><button class="iconbtn" id="team-close">${icon("close", 16)}</button></div>
        <div class="tabs">
          <button class="tab on" data-tab="members">Equipo</button>
          <button class="tab" data-tab="fronts">Frentes</button>
        </div>
        <div class="mb" id="team-body"></div>
        <div class="mf"><button class="btn" id="team-close2">Cerrar</button></div>
      </div>
    </div>
  `;
  const overlay = root.querySelector("#team-overlay");
  const body = root.querySelector("#team-body");
  let tab = "members";

  function close() {
    overlay.classList.remove("show");
  }
  function open() {
    overlay.classList.add("show");
    renderTab();
  }
  root.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      tab = t.dataset.tab;
      root.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === t));
      renderTab();
    }),
  );
  root.querySelector("#team-close").addEventListener("click", close);
  root.querySelector("#team-close2").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  function renderTab() {
    body.innerHTML = tab === "members" ? memberRowFormTemplate() : frontRowFormTemplate();
    if (tab === "members") mountMembersList();
    else mountFrontsList();
  }

  // ---- members --------------------------------------------------------
  function memberRowFormTemplate() {
    return `
      <div class="list-rows" id="members-list"><div class="sk sk-row"></div><div class="sk sk-row"></div></div>
      <div class="panel" style="margin-top:14px;padding:14px">
        <div class="fl mono" style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-bottom:10px">Agregar miembro</div>
        <div class="frow2" style="margin-bottom:10px">
          <div class="field"><label>Nombre</label><input id="m-name" type="text" placeholder="Nombre completo" /></div>
          <div class="field"><label>Rol</label><input id="m-role" type="text" placeholder="Ej. Dirección & alianzas" /></div>
        </div>
        <div class="frow3" style="margin-bottom:10px">
          <div class="field"><label>Email</label><input id="m-email" type="email" placeholder="correo@ailearning.mx" /></div>
          <div class="field"><label>Color</label><input id="m-color" type="color" value="#4C9BF0" /></div>
          <div class="field" style="display:flex;align-items:flex-end;gap:8px"><label style="margin:0"><input type="checkbox" id="m-admin" /> Administrador</label></div>
        </div>
        <button class="btn pri" id="m-add">${icon("plus", 14)} Agregar miembro</button>
      </div>
    `;
  }

  function mountMembersList() {
    const q = getQuery("members", () => listMembers());
    const unsub = q.subscribe((state) => {
      const el = body.querySelector("#members-list");
      if (!el) {
        unsub();
        return;
      }
      if (state.status === "loading" || state.status === "idle") {
        el.innerHTML = `<div class="sk sk-row"></div><div class="sk sk-row"></div>`;
        return;
      }
      if (state.status === "error") {
        el.innerHTML = `<div class="error-state">Error al cargar el equipo.</div>`;
        return;
      }
      el.innerHTML = state.data
        .map(
          (m) => `<div class="list-row">
            <span class="swatch" style="background:${m.color || "#4C9BF0"}"></span>
            <div class="lr-main">
              <div class="lr-name">${escapeHtml(m.name)} ${m.isAdmin ? '<span class="admin-pill">ADMIN</span>' : ""}</div>
              <div class="lr-sub">${escapeHtml(m.role || "")}${m.email ? ` · ${escapeHtml(m.email)}` : ""}</div>
            </div>
            <div class="lr-actions">
              <button class="iconbtn" data-edit-member="${m.id}" title="Editar">${icon("edit", 14)}</button>
              <button class="iconbtn" data-del-member="${m.id}" title="Eliminar">${icon("trash", 14)}</button>
            </div>
          </div>`,
        )
        .join("");

      el.querySelectorAll("[data-edit-member]").forEach((b) => b.addEventListener("click", () => editMember(state.data.find((m) => m.id === b.dataset.editMember))));
      el.querySelectorAll("[data-del-member]").forEach((b) =>
        b.addEventListener("click", async () => {
          const m = state.data.find((x) => x.id === b.dataset.delMember);
          if (!confirm(`¿Eliminar a ${m.name} del equipo?`)) return;
          try {
            await deleteMember(m.id);
            invalidate(["members", "activities"]);
            toastOk("Miembro eliminado.");
          } catch (err) {
            toastError(friendlyError(err));
          }
        }),
      );
    });

    body.querySelector("#m-add").addEventListener("click", async () => {
      const name = body.querySelector("#m-name").value.trim();
      if (!name) return body.querySelector("#m-name").focus();
      try {
        await createMember({
          name,
          role: body.querySelector("#m-role").value.trim(),
          email: body.querySelector("#m-email").value.trim() || null,
          color: body.querySelector("#m-color").value,
          isAdmin: body.querySelector("#m-admin").checked,
        });
        invalidate(["members"]);
        toastOk("Miembro agregado.");
        renderTab();
      } catch (err) {
        toastError(friendlyError(err));
      }
    });
  }

  function editMember(m) {
    if (!m) return;
    const name = prompt("Nombre", m.name);
    if (name === null) return;
    const role = prompt("Rol", m.role || "");
    if (role === null) return;
    const email = prompt("Email", m.email || "");
    if (email === null) return;
    const isAdmin = confirm("¿Es administrador? Aceptar = sí, Cancelar = no.");
    updateMember(m.id, { name, role, email: email || null, isAdmin })
      .then(() => {
        invalidate(["members"]);
        toastOk("Miembro actualizado.");
      })
      .catch((err) => toastError(friendlyError(err)));
  }

  // ---- fronts ----------------------------------------------------------
  function frontRowFormTemplate() {
    return `
      <div class="list-rows" id="fronts-list"><div class="sk sk-row"></div><div class="sk sk-row"></div></div>
      <div class="panel" style="margin-top:14px;padding:14px">
        <div class="fl mono" style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-bottom:10px">Agregar frente</div>
        <div class="frow3" style="margin-bottom:10px">
          <div class="field"><label>Nombre</label><input id="f-name" type="text" placeholder="Ej. Capacitaciones" /></div>
          <div class="field"><label>Tag</label><input id="f-tag" type="text" placeholder="Ej. Formación & temario" /></div>
          <div class="field"><label>Color</label><input id="f-color" type="color" value="#7fc0ff" /></div>
        </div>
        <button class="btn pri" id="f-add">${icon("plus", 14)} Agregar frente</button>
      </div>
    `;
  }

  function mountFrontsList() {
    const q = getQuery("fronts", () => listFronts());
    const unsub = q.subscribe((state) => {
      const el = body.querySelector("#fronts-list");
      if (!el) {
        unsub();
        return;
      }
      if (state.status === "loading" || state.status === "idle") {
        el.innerHTML = `<div class="sk sk-row"></div><div class="sk sk-row"></div>`;
        return;
      }
      if (state.status === "error") {
        el.innerHTML = `<div class="error-state">Error al cargar los frentes.</div>`;
        return;
      }
      el.innerHTML = state.data
        .map(
          (f) => `<div class="list-row">
            <span class="swatch" style="background:${f.color || "#7fc0ff"}"></span>
            <div class="lr-main">
              <div class="lr-name">${escapeHtml(f.name)}</div>
              <div class="lr-sub">${escapeHtml(f.tag || "")}</div>
            </div>
            <div class="lr-actions">
              <button class="iconbtn" data-edit-front="${f.id}" title="Editar">${icon("edit", 14)}</button>
              <button class="iconbtn" data-del-front="${f.id}" title="Eliminar">${icon("trash", 14)}</button>
            </div>
          </div>`,
        )
        .join("");

      el.querySelectorAll("[data-edit-front]").forEach((b) => b.addEventListener("click", () => editFront(state.data.find((f) => f.id === b.dataset.editFront))));
      el.querySelectorAll("[data-del-front]").forEach((b) =>
        b.addEventListener("click", async () => {
          const f = state.data.find((x) => x.id === b.dataset.delFront);
          if (!confirm(`¿Eliminar el frente "${f.name}"? Las actividades asociadas quedarán sin frente.`)) return;
          try {
            await deleteFront(f.id);
            invalidate(["fronts", "activities"]);
            toastOk("Frente eliminado.");
          } catch (err) {
            toastError(friendlyError(err));
          }
        }),
      );
    });

    body.querySelector("#f-add").addEventListener("click", async () => {
      const name = body.querySelector("#f-name").value.trim();
      if (!name) return body.querySelector("#f-name").focus();
      try {
        await createFront({ name, tag: body.querySelector("#f-tag").value.trim(), color: body.querySelector("#f-color").value });
        invalidate(["fronts"]);
        toastOk("Frente agregado.");
        renderTab();
      } catch (err) {
        toastError(friendlyError(err));
      }
    });
  }

  function editFront(f) {
    if (!f) return;
    const name = prompt("Nombre", f.name);
    if (name === null) return;
    const tagVal = prompt("Tag", f.tag || "");
    if (tagVal === null) return;
    updateFront(f.id, { name, tag: tagVal })
      .then(() => {
        invalidate(["fronts"]);
        toastOk("Frente actualizado.");
      })
      .catch((err) => toastError(friendlyError(err)));
  }

  return { open, close };
}
