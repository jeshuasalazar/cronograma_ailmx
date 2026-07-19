// KPI strip: total activas, en proceso, en espera/riesgo, completadas.
// One combined query ("activities:kpi") so all four cards share a single
// loading/error/retry lifecycle; invalidated by the "activities" prefix
// whenever an activity is created/updated/deleted (see main.js's realtime
// wiring), so it never needs a manual refresh.
import { listActivities } from "../repo/index.js";
import { getQuery } from "../store.js";
import { icon } from "./icons.js";

async function fetchKpis() {
  const [total, prog, wait, done] = await Promise.all([
    listActivities({ pageSize: 1 }).then((r) => r.total),
    listActivities({ status: "prog", pageSize: 1 }).then((r) => r.total),
    listActivities({ status: "wait", pageSize: 1 }).then((r) => r.total),
    listActivities({ status: "done", pageSize: 1 }).then((r) => r.total),
  ]);
  return { total, prog, wait, done, activas: total - done };
}

function skeletonHTML() {
  return Array.from({ length: 4 })
    .map(() => `<div class="kpi skel"><div class="top"><div class="num">—</div></div><div class="lab sk" style="width:70%;height:9px;margin-top:12px"></div></div>`)
    .join("");
}

export function mountKpis(root) {
  const q = getQuery("activities:kpi", fetchKpis);

  return q.subscribe((state) => {
    if (state.status === "loading" || state.status === "idle") {
      root.innerHTML = skeletonHTML();
      return;
    }
    if (state.status === "error") {
      root.innerHTML = `<div class="kpi" style="grid-column:1/-1"><div class="error-state" style="padding:14px 0">
        No se pudieron cargar los KPIs. <button class="btn sm" id="kpi-retry">Reintentar</button>
      </div></div>`;
      root.querySelector("#kpi-retry")?.addEventListener("click", () => q.refetch());
      return;
    }
    const d = state.data;
    const cards = [
      { n: d.activas, l: "Total activas", t: `${d.total} actividades en total`, c: "var(--blue)", ic: "bolt" },
      { n: d.prog, l: "En proceso", t: "Con seguimiento activo", c: "var(--blue-2)", ic: "clock" },
      { n: d.wait, l: "En espera / riesgo", t: "Requieren atención", c: "var(--coral)", ic: "alert" },
      { n: d.done, l: "Completadas", t: "Avances confirmados / validados", c: "var(--green)", ic: "check" },
    ];
    root.innerHTML = cards
      .map(
        (k) => `<div class="kpi" style="--accent:${k.c}">
          <div class="top"><div class="num">${k.n}</div><div class="ic">${icon(k.ic, 18)}</div></div>
          <div class="lab">${k.l}</div><div class="trend">${k.t}</div>
        </div>`,
      )
      .join("");
  });
}
