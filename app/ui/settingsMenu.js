// Settings dropdown: export/import JSON, legacy-panel migration shortcut,
// and the entry point into the team/fronts admin modal.
import { exportJSON, importJSON, readLegacyV2 } from "../repo/importExport.js";
import { icon } from "./icons.js";
import { toast, toastOk, toastError, friendlyError } from "./toast.js";
import { invalidate } from "../store.js";

export function mountSettingsMenu(root, ctx) {
  const legacy = readLegacyV2();

  root.innerHTML = `
    <button class="iconbtn" id="settings-btn" title="Ajustes">${icon("gear", 16)}</button>
    <div class="dropdown" id="settings-dropdown">
      <button id="do-export">${icon("download", 15)} Exportar JSON</button>
      <button id="do-import">${icon("upload", 15)} Importar JSON</button>
      ${legacy ? `<button id="do-migrate">${icon("refresh", 15)} Migrar datos del panel anterior</button>` : ""}
      <hr />
      <button id="open-team">${icon("users", 15)} Gestionar equipo y frentes</button>
      <input type="file" id="import-file" accept="application/json" style="display:none" />
    </div>
  `;

  const dropdown = root.querySelector("#settings-dropdown");
  const btn = root.querySelector("#settings-btn");

  function close() {
    dropdown.classList.remove("show");
  }
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });
  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) close();
  });

  root.querySelector("#do-export").addEventListener("click", async () => {
    close();
    try {
      const data = await exportJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ailearning-panel-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toastOk("Exportación descargada.");
    } catch (err) {
      toastError(friendlyError(err));
    }
  });

  const fileInput = root.querySelector("#import-file");
  root.querySelector("#do-import").addEventListener("click", () => {
    close();
    fileInput.click();
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      toastError("El archivo no es JSON válido.");
      return;
    }
    if (!confirm("¿Importar este archivo? Se agregarán frentes, miembros, actividades y eventos al panel actual (no se borra nada existente).")) return;
    try {
      const res = await importJSON(data);
      invalidate(["fronts", "members", "activities", "events"]);
      toastOk(`Importado: ${res.activities} actividades, ${res.notes} notas, ${res.events} eventos.`);
    } catch (err) {
      toastError(friendlyError(err));
    }
  });

  const migrateBtn = root.querySelector("#do-migrate");
  if (migrateBtn) {
    migrateBtn.addEventListener("click", async () => {
      close();
      if (!confirm("¿Migrar los datos del panel anterior (localStorage) a este panel? Se agregarán como nuevas actividades.")) return;
      try {
        const res = await importJSON(legacy);
        invalidate(["fronts", "members", "activities", "events"]);
        toastOk(`Migración completa: ${res.activities} actividades importadas.`);
      } catch (err) {
        toastError(friendlyError(err));
      }
    });
  }

  root.querySelector("#open-team").addEventListener("click", () => {
    close();
    ctx.openTeamAdmin();
  });
}
