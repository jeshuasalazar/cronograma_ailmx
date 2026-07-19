// Top bar: logo, live clock, demo/live badge, current user + logout,
// settings menu (export/import/team). Mounted once; updates in place.
import { signOut } from "../auth.js";
import { escapeHtml, initials, avatarStyle, MESES, DIAS } from "./format.js";
import { icon } from "./icons.js";
import { mountSettingsMenu } from "./settingsMenu.js";

export function mountTopbar(root, ctx) {
  const who = ctx.me?.name || ctx.session?.user?.email || "—";
  root.innerHTML = `
    <div class="topbar">
      <div class="tb-l">
        <img src="/assets/logo-wordmark.png" alt="aiLearning" onerror="this.style.display='none'" />
        <div class="tb-sep"></div>
        <div class="tb-title">
          <span class="k mono">Panel de administración</span>
          <span class="v">Operaciones en tiempo real</span>
        </div>
      </div>
      <div class="tb-r">
        <span class="badge ${ctx.isDemoMode ? "demo" : "live"}">
          <span class="dot"></span>${ctx.isDemoMode ? "Modo demo — sin conexión Supabase" : "En vivo"}
        </span>
        <div class="clock"><div class="t" id="clk-t">--:--:--</div><div class="d" id="clk-d">—</div></div>
        <div class="tb-user">
          <span class="av" style="${avatarStyle(ctx.me?.color)}">${initials(who)}</span>
          <span class="nm">${escapeHtml(who)}</span>
        </div>
        <div id="settings-slot" class="dropdown-wrap"></div>
        <button class="iconbtn" id="logout-btn" title="Cerrar sesión">${icon("logout", 16)}</button>
      </div>
    </div>
  `;

  root.querySelector("#logout-btn").addEventListener("click", () => signOut());

  mountSettingsMenu(root.querySelector("#settings-slot"), ctx);

  function tick() {
    const d = new Date();
    const t = root.querySelector("#clk-t");
    const dd = root.querySelector("#clk-d");
    if (!t) return; // topbar was replaced
    t.textContent = d.toLocaleTimeString("es-MX", { hour12: false });
    dd.textContent = `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
  }
  tick();
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}
