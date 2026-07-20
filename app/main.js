// App entry point / bootstrap. Owns the auth gate (login → panel) and the
// realtime → store.invalidate() wiring; everything else is delegated to
// app/ui/*.js components, each mounted into a "slot" element of the shell
// below and driven by app/store.js query subscriptions.
import "./styles.css";
import { initTheme } from "./theme.js";
import { isDemoMode } from "./supabaseClient.js";
import { initAuth, onAuthChange, getCurrentMember, signOut } from "./auth.js";
import { listFronts, listMembers, subscribe as repoSubscribe } from "./repo/index.js";
import { getQuery, invalidate } from "./store.js";
import { renderLogin, renderNotLinked } from "./ui/login.js";
import { mountTopbar } from "./ui/topbar.js";
import { mountKpis } from "./ui/kpis.js";
import { mountFilters, loadPersistedFilters } from "./ui/filters.js";
import { mountActivityList } from "./ui/activityList.js";
import { mountActivityDetail } from "./ui/activityDetail.js";
import { mountNewActivityModal } from "./ui/newActivityModal.js";
import { mountTeamAdmin } from "./ui/teamAdmin.js";
import { mountFronts } from "./ui/fronts.js";
import { mountTeam } from "./ui/team.js";
import { mountFeed } from "./ui/feed.js";
import { icon } from "./ui/icons.js";

const appEl = document.getElementById("app");

let lastUserKey; // undefined on first run so the very first session always mounts
let realtimeUnsub = null;
let topbarUnmount = null;
let sideUnmounts = [];

// A single user action (e.g. editing a field that autosaves every 500ms,
// or an update that also writes an activity_events row and touches
// activity_assignees) can fan out into several near-simultaneous Realtime
// events. Invalidating — and therefore refetching — once per raw event
// let refetches pile up faster than they resolved under sustained use,
// eventually wedging the app until a full page reload. Coalesce every
// invalidation key seen within a short window into one `invalidate()`
// call so a burst of related events costs one network round-trip per
// query instead of one per event.
const INVALIDATE_BATCH_MS = 300;
let pendingInvalidations = new Set();
let invalidateTimer = null;

function batchInvalidate(keys) {
  for (const k of keys) pendingInvalidations.add(k);
  if (invalidateTimer) return;
  invalidateTimer = setTimeout(() => {
    invalidateTimer = null;
    const keysToFlush = [...pendingInvalidations];
    pendingInvalidations = new Set();
    invalidate(keysToFlush);
  }, INVALIDATE_BATCH_MS);
}

function clearPendingInvalidations() {
  if (invalidateTimer) {
    clearTimeout(invalidateTimer);
    invalidateTimer = null;
  }
  pendingInvalidations = new Set();
}

function renderGateLoading() {
  appEl.innerHTML = `<div class="gate"><div class="gate-loading"><div class="spinner"></div>Cargando sesión…</div></div>`;
}

function shellHTML() {
  return `
    <div class="wrap">
      <div id="topbar-slot"></div>
      <div class="kpis" id="kpis-slot"></div>
      <div class="layout">
        <div class="panel">
          <div class="head">
            <h2>Tablero de actividades</h2>
            <div style="display:flex;align-items:center;gap:12px">
              <span class="cnt" id="board-cnt"></span>
              <button class="btn pri" id="add-activity-btn">${icon("plus", 15)} Nueva actividad</button>
            </div>
          </div>
          <div id="filters-slot"></div>
          <div id="list-slot"></div>
        </div>
        <div class="side">
          <div class="panel">
            <div class="head"><h2>Avance por frente</h2></div>
            <div class="fronts" id="fronts-slot"></div>
          </div>
          <div class="panel">
            <div class="head"><h2>Equipo</h2><span class="cnt" id="team-cnt"></span></div>
            <div class="team" id="team-slot"></div>
          </div>
          <div class="panel">
            <div class="head">
              <h2><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);animation:beat 1.8s infinite"></span>Actividad reciente</h2>
              <span class="cnt" id="feed-cnt"></span>
            </div>
            <div class="feed" id="feed-slot"></div>
          </div>
        </div>
      </div>
      <div class="foot">
        <span>aiLearning® · Panel interno de operaciones</span>
        <span>${isDemoMode ? "Datos locales (localStorage)" : "Conectado a Supabase"}</span>
      </div>
    </div>
    <div id="drawer-slot"></div>
    <div id="newactivity-slot"></div>
    <div id="teamadmin-slot"></div>
  `;
}

function teardownPanel() {
  realtimeUnsub?.();
  realtimeUnsub = null;
  clearPendingInvalidations();
  topbarUnmount?.();
  topbarUnmount = null;
  sideUnmounts.forEach((fn) => fn?.());
  sideUnmounts = [];
}

// Pure mapping from a single Realtime change to the invalidation keys it
// implies — no side effects here; the caller (repoSubscribe callback
// below) is responsible for batching these through batchInvalidate().
function mapChangeToInvalidation(change) {
  const { table } = change || {};
  if (table === "fronts") return ["fronts"];
  if (table === "team_members") return ["members"];
  // activities → list + KPIs + detail (all keyed under the "activities:" prefix).
  // Every activity mutation in this app also logs an activity_events row, so we
  // proactively refresh the feed too rather than waiting for a separate
  // "events" realtime message that may not arrive for every backend.
  if (table === "activities") return ["activities", "events"];
  // notes → detail (embedded notes array) + feed.
  if (table === "notes") return ["activities", "events"];
  if (table === "events") return ["events"];
  // "*" — cross-tab localStorage sync or a bulk import: refresh everything.
  return ["fronts", "members", "activities", "events"];
}

function mountPanel(session, me) {
  appEl.innerHTML = shellHTML();

  const ctx = {
    isDemoMode,
    session,
    me,
    frontsQuery: getQuery("fronts", () => listFronts()),
    membersQuery: getQuery("members", () => listMembers()),
    getFronts() {
      return ctx.frontsQuery.getState().data || [];
    },
    getMembers() {
      return ctx.membersQuery.getState().data || [];
    },
    openDetail: (id) => detailApi.open(id),
    openTeamAdmin: () => teamAdminApi.open(),
  };

  topbarUnmount = mountTopbar(document.getElementById("topbar-slot"), ctx);
  mountKpis(document.getElementById("kpis-slot"));

  const detailApi = mountActivityDetail(document.getElementById("drawer-slot"), ctx);
  const newActivityApi = mountNewActivityModal(document.getElementById("newactivity-slot"), ctx);
  const teamAdminApi = mountTeamAdmin(document.getElementById("teamadmin-slot"), ctx);

  document.getElementById("add-activity-btn").addEventListener("click", () => newActivityApi.open());

  const countEl = document.getElementById("board-cnt");
  const listApi = mountActivityList(document.getElementById("list-slot"), ctx, {
    filters: loadPersistedFilters(),
    countEl,
  });
  const filtersApi = mountFilters(document.getElementById("filters-slot"), ctx, {
    initial: loadPersistedFilters(),
    onChange: (filters) => listApi.setFilters(filters),
  });

  sideUnmounts.push(mountFronts(document.getElementById("fronts-slot"), ctx));
  sideUnmounts.push(mountTeam(document.getElementById("team-slot"), document.getElementById("team-cnt"), ctx));
  sideUnmounts.push(mountFeed(document.getElementById("feed-slot"), document.getElementById("feed-cnt")));
  sideUnmounts.push(() => filtersApi.destroy());

  realtimeUnsub = repoSubscribe((change) => batchInvalidate(mapChangeToInvalidation(change)));
}

async function handleSession(session) {
  teardownPanel();

  if (!session) {
    renderLogin(appEl);
    return;
  }
  const me = await getCurrentMember(session);
  if (!me && !isDemoMode) {
    renderNotLinked(appEl, session, () => signOut());
    return;
  }
  mountPanel(session, me);
}

// Close any open inline popover (status/priority quick-actions) on outside click.
document.addEventListener("click", (e) => {
  if (!e.target.closest(".stat") && !e.target.closest(".pop") && !e.target.closest("[data-prio]")) {
    document.querySelectorAll(".pop.show").forEach((p) => p.classList.remove("show"));
  }
});

async function boot() {
  initTheme();
  renderGateLoading();
  const session = await initAuth();
  lastUserKey = session?.user?.id ?? null;
  await handleSession(session);

  onAuthChange(async (nextSession) => {
    const key = nextSession?.user?.id ?? null;
    if (key === lastUserKey) return; // token refresh / no-op — skip a full remount
    lastUserKey = key;
    await handleSession(nextSession);
  });
}

boot();
