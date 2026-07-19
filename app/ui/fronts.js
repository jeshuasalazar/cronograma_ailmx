// "Avance por frente" sidebar panel — average progress per front.
import { getSidebarActivitiesQuery } from "./sidebarData.js";
import { escapeHtml } from "./format.js";

export function mountFronts(root, ctx) {
  function render() {
    const fronts = ctx.getFronts();
    const activitiesState = getSidebarActivitiesQuery().getState();

    if (!fronts.length) {
      root.innerHTML = `<div class="sk sk-row"></div><div class="sk sk-row"></div>`;
      return;
    }
    if (activitiesState.status === "loading" || activitiesState.status === "idle") {
      root.innerHTML = `<div class="sk sk-row"></div><div class="sk sk-row"></div>`;
      return;
    }
    if (activitiesState.status === "error") {
      root.innerHTML = `<div class="error-state" style="padding:16px 0">Error al calcular el avance.</div>`;
      return;
    }
    const items = activitiesState.data;
    root.innerHTML = fronts
      .map((f) => {
        const own = items.filter((a) => a.front === f.id);
        const pct = own.length ? Math.round(own.reduce((s, a) => s + a.progress, 0) / own.length) : 0;
        return `<div class="fitem">
          <div class="frow">
            <div class="fname"><div class="n">${escapeHtml(f.name)}</div><div class="s">${own.length} actividad${own.length !== 1 ? "es" : ""} · ${escapeHtml(f.tag || "")}</div></div>
            <div class="pct">${pct}%</div>
          </div>
          <div class="bar"><i style="width:${pct}%;background:linear-gradient(90deg,${f.color || "var(--blue-deep)"},${f.color || "var(--blue-2)"})"></i></div>
        </div>`;
      })
      .join("");
  }

  render();
  const unsub1 = ctx.frontsQuery.subscribe(render);
  const unsub2 = getSidebarActivitiesQuery().subscribe(render);
  return () => {
    unsub1();
    unsub2();
  };
}
