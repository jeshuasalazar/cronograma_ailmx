// Provisional entry point — proves the data layer (auth + repo + store)
// works end to end. The UI/UX agent replaces this with the real panel;
// it should keep using `initAuth`/`onAuthChange` from ./auth.js and
// `getQuery`/`mutate`/`invalidate` from ./store.js against ./repo/index.js.
import { isDemoMode } from "./supabaseClient.js";
import { initAuth, onAuthChange, signOut } from "./auth.js";
import { listFronts, listActivities } from "./repo/index.js";
import { getQuery } from "./store.js";

const app = document.getElementById("app");

function styleOnce() {
  if (document.getElementById("boot-style")) return;
  const style = document.createElement("style");
  style.id = "boot-style";
  style.textContent = `
    :root{ --blue:#2D88E8; --bg:#070E18; --txt:#EAF1FB; --txt-2:#AEBDD2; --mute:#6C7B92; --stroke:rgba(255,255,255,.10); --green:#3DD68C; }
    *{box-sizing:border-box}
    html{-webkit-font-smoothing:antialiased}
    body{margin:0;font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--txt);min-height:100vh}
    .boot-wrap{max-width:760px;margin:0 auto;padding:60px 24px}
    .boot-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:28px}
    .boot-title{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:22px;letter-spacing:-0.01em}
    .badge{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:6px 12px;border-radius:999px;border:1px solid var(--stroke);display:inline-flex;align-items:center;gap:8px}
    .badge .dot{width:7px;height:7px;border-radius:50%}
    .badge.demo{color:#F5B841;border-color:rgba(245,184,65,.35);background:rgba(245,184,65,.1)}
    .badge.demo .dot{background:#F5B841}
    .badge.live{color:var(--green);border-color:rgba(61,214,140,.35);background:rgba(61,214,140,.1)}
    .badge.live .dot{background:var(--green)}
    .panel{border:1px solid var(--stroke);border-radius:16px;padding:22px;background:rgba(255,255,255,.04);margin-bottom:16px}
    .panel h2{font-family:'Space Grotesk',sans-serif;font-size:14px;margin:0 0 12px;color:var(--txt-2);text-transform:uppercase;letter-spacing:.08em;font-weight:600}
    .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--stroke);font-size:13.5px}
    .row:last-child{border-bottom:none}
    .muted{color:var(--mute);font-family:'JetBrains Mono',monospace;font-size:11px}
    .construction{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-top:22px;text-align:center}
    .signout{cursor:pointer;background:none;border:1px solid var(--stroke);color:var(--txt-2);padding:6px 12px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:12px}
    .signout:hover{color:var(--txt);border-color:rgba(255,255,255,.25)}
  `;
  document.head.appendChild(style);
}

function renderBoot(session) {
  styleOnce();
  const who = session?.user?.user_metadata?.name || session?.user?.email || "—";

  app.innerHTML = `
    <div class="boot-wrap">
      <div class="boot-top">
        <div class="boot-title">aiLearning — Panel de Operaciones</div>
        <span class="badge ${isDemoMode ? "demo" : "live"}"><span class="dot"></span>${isDemoMode ? "Modo demo" : "Conectado a Supabase"}</span>
      </div>

      <div class="panel">
        <h2>Sesión</h2>
        <div class="row"><span>Usuario</span><span>${who}</span></div>
        <div class="row"><span>Backend</span><span>${isDemoMode ? "localStorage (ail_ops_v3)" : "Supabase"}</span></div>
        <div style="margin-top:14px"><button class="signout" id="signout-btn">Cerrar sesión</button></div>
      </div>

      <div class="panel">
        <h2>Frentes</h2>
        <div id="fronts-list" class="muted">Cargando…</div>
      </div>

      <div class="panel">
        <h2>Actividades</h2>
        <div id="activities-summary" class="muted">Cargando…</div>
      </div>

      <div class="construction">Panel en construcción — capa de datos lista, UI en camino</div>
    </div>
  `;

  document.getElementById("signout-btn").onclick = () => signOut();

  const frontsQuery = getQuery("fronts", () => listFronts());
  frontsQuery.subscribe((state) => {
    const el = document.getElementById("fronts-list");
    if (!el) return;
    if (state.status === "loading" || state.status === "idle") {
      el.textContent = "Cargando…";
    } else if (state.status === "error") {
      el.textContent = `Error: ${state.error?.message || state.error}`;
    } else {
      el.innerHTML = state.data
        .map((f) => `<div class="row"><span>${f.name}</span><span class="muted">${f.tag}</span></div>`)
        .join("");
    }
  });

  const activitiesQuery = getQuery("activities:all", () => listActivities({ page: 1, pageSize: 500 }));
  activitiesQuery.subscribe((state) => {
    const el = document.getElementById("activities-summary");
    if (!el) return;
    if (state.status === "loading" || state.status === "idle") {
      el.textContent = "Cargando…";
    } else if (state.status === "error") {
      el.textContent = `Error: ${state.error?.message || state.error}`;
    } else {
      const items = state.data.items;
      const byStatus = items.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});
      el.innerHTML = `
        <div class="row"><span>Total</span><span>${state.data.total}</span></div>
        <div class="row"><span>Completadas</span><span>${byStatus.done || 0}</span></div>
        <div class="row"><span>En proceso</span><span>${byStatus.prog || 0}</span></div>
        <div class="row"><span>En espera</span><span>${byStatus.wait || 0}</span></div>
        <div class="row"><span>Pendientes</span><span>${byStatus.todo || 0}</span></div>
      `;
    }
  });
}

function renderLoading() {
  styleOnce();
  app.innerHTML = `<div class="boot-wrap"><div class="construction">Cargando sesión…</div></div>`;
}

async function boot() {
  renderLoading();
  const session = await initAuth();
  renderBoot(session);
  onAuthChange((nextSession) => {
    if (!nextSession) {
      renderLoading();
    } else {
      renderBoot(nextSession);
    }
  });
}

boot();
