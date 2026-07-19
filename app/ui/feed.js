// Global "Actividad reciente" feed — listEvents() without activityId,
// paginated via "cargar más" (grows the limit param and refetches; the
// repo interface has no offset for events, so this mirrors the notes/
// history pagination approach used in activityDetail.js).
import { listEvents } from "../repo/index.js";
import { getQuery } from "../store.js";
import { STATUS } from "../repo/seedData.js";
import { escapeHtml, relTime } from "./format.js";

const KEY = "events:global";
const STEP = 20;

function describeEvent(e) {
  const who = `<b>${escapeHtml(e.actorName || "Alguien")}</b>`;
  const title = `<b>${escapeHtml(e.activityTitle || "una actividad")}</b>`;
  switch (e.kind) {
    case "created":
      return `${who} creó ${title}.`;
    case "status_changed":
      return `${who} cambió el estado de ${title} a <b>${escapeHtml(STATUS[e.payload?.status]?.label || e.payload?.status || "")}</b>.`;
    case "progress_changed":
      return `${who} actualizó el avance de ${title} a <b>${e.payload?.progress ?? "?"}%</b>.`;
    case "note_added":
      return `${who} agregó una nota en ${title}.`;
    case "updated":
      return `${who} actualizó ${title}.`;
    default:
      return `${who}: ${escapeHtml(e.kind)} en ${title}${e.payload?.text ? ` — ${escapeHtml(e.payload.text)}` : ""}`;
  }
}
function dotColor(e) {
  if (e.kind === "status_changed") return STATUS[e.payload?.status]?.color || "#4C9BF0";
  if (e.kind === "created") return "#3DD68C";
  if (e.kind === "note_added") return "#4C9BF0";
  return "#6C7B92";
}

export function mountFeed(root, countEl) {
  let limit = STEP;
  const q = getQuery(KEY, () => listEvents({ limit }));

  const unsub = q.subscribe((state) => {
    if (state.status === "loading" || state.status === "idle") {
      root.innerHTML = `<div class="sk sk-row" style="height:50px"></div><div class="sk sk-row" style="height:50px"></div>`;
      if (countEl) countEl.textContent = "";
      return;
    }
    if (state.status === "error") {
      root.innerHTML = `<div class="error-state" style="padding:16px 0">No se pudo cargar el feed. <button class="btn sm" id="feed-retry">Reintentar</button></div>`;
      root.querySelector("#feed-retry")?.addEventListener("click", () => q.refetch());
      return;
    }
    const events = state.data;
    if (countEl) countEl.textContent = `${events.length} evento${events.length !== 1 ? "s" : ""}`;
    if (!events.length) {
      root.innerHTML = `<div class="empty-state">Sin actividad reciente.</div>`;
      return;
    }
    root.innerHTML =
      events.map((e) => `<div class="fevent" style="--dotc:${dotColor(e)}"><div class="txt">${describeEvent(e)}</div><div class="when">${relTime(e.createdAt)}</div></div>`).join("") +
      (events.length >= limit ? `<div class="feed-more"><button class="btn sm" id="feed-more">Cargar más</button></div>` : "");
    root.querySelector("#feed-more")?.addEventListener("click", () => {
      limit += STEP;
      getQuery(KEY, () => listEvents({ limit })).refetch();
    });
  });

  return unsub;
}
