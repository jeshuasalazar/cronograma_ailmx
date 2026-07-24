// localStorage-backed implementation of the repo interface (see
// `app/repo/index.js` for the interface contract shared with
// `supabaseRepo.js`). Used automatically in demo mode.
//
// Field names/shape match the real Supabase schema
// (`supabase/migrations/001_schema.sql`) 1:1 in camelCase, so switching
// between this and supabaseRepo.js is a non-event for the UI layer.
//
// Storage key: "ail_ops_v3" (distinct from the legacy panel's
// "ail_ops_v2" — see `importExport.js` for migrating v2 data in).
import { seedFronts, seedMembers, seedActivities, seedEvents, seedSessions } from "./seedData.js";

const KEY = "ail_ops_v3";

function nowISO() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.activities)) {
        // older persisted states predate `sessions` — backfill with seed data
        if (!Array.isArray(parsed.sessions)) parsed.sessions = structuredClone(seedSessions);
        return parsed;
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[aiLearning] localRepo: estado corrupto en localStorage, reinicializando seed.", e);
  }
  return {
    fronts: structuredClone(seedFronts),
    members: structuredClone(seedMembers),
    activities: structuredClone(seedActivities),
    events: structuredClone(seedEvents),
    sessions: structuredClone(seedSessions),
  };
}

let state = loadState();

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

// ---- change subscription (mimics the shape of supabaseRepo's Realtime
// subscription: listeners get {table, type} invalidation hints) ----
const listeners = new Set();
function emit(table, type) {
  for (const cb of listeners) cb({ table, type });
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    state = loadState();
    emit("*", "external-sync");
  });
}

/**
 * @param {(change: {table: string, type: string}) => void} cb
 * @returns {() => void} unsubscribe
 */
export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function logEvent(activityId, { actorId = null, kind, payload = {} }) {
  const entry = { id: uid("event"), activityId, actorId, kind, payload, createdAt: nowISO() };
  state.events.unshift(entry);
  if (state.events.length > 500) state.events.length = 500;
  return entry;
}

// ---------------------------------------------------------------- fronts
export async function listFronts() {
  const fronts = structuredClone(state.fronts);
  fronts.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return fronts;
}

export async function createFront(data) {
  const front = {
    id: uid("front"),
    name: data.name,
    tag: data.tag || "",
    color: data.color || "#4C9BF0",
    position: data.position ?? state.fronts.length,
  };
  state.fronts.push(front);
  persist();
  emit("fronts", "insert");
  return structuredClone(front);
}

export async function updateFront(id, patch) {
  const front = state.fronts.find((f) => f.id === id);
  if (!front) throw new Error(`Front no encontrado: ${id}`);
  Object.assign(front, patch);
  persist();
  emit("fronts", "update");
  return structuredClone(front);
}

export async function deleteFront(id) {
  state.fronts = state.fronts.filter((f) => f.id !== id);
  persist();
  emit("fronts", "delete");
}

// --------------------------------------------------------------- members
export async function listMembers() {
  return structuredClone(state.members);
}

export async function createMember(data) {
  const member = {
    id: uid("member"),
    name: data.name,
    role: data.role || "",
    color: data.color || "#4C9BF0",
    email: data.email || null,
    authUserId: data.authUserId || null,
    isAdmin: !!data.isAdmin,
  };
  state.members.push(member);
  persist();
  emit("team_members", "insert");
  return structuredClone(member);
}

export async function updateMember(id, patch) {
  const member = state.members.find((m) => m.id === id);
  if (!member) throw new Error(`Miembro no encontrado: ${id}`);
  Object.assign(member, patch);
  persist();
  emit("team_members", "update");
  return structuredClone(member);
}

export async function deleteMember(id) {
  state.members = state.members.filter((m) => m.id !== id);
  persist();
  emit("team_members", "delete");
}

// ------------------------------------------------------------ activities
/**
 * @param {object} [filters]
 * @param {string} [filters.status] - 'todo'|'prog'|'wait'|'done'
 * @param {string} [filters.priority] - 'low'|'medium'|'high'|'urgent'
 * @param {string} [filters.front] - front id
 * @param {string} [filters.assignee] - member id
 * @param {string} [filters.q] - free-text search (title/description/front/assignee names)
 * @param {string} [filters.dueBefore] - ISO date, inclusive
 * @param {string} [filters.dueAfter] - ISO date, inclusive
 * @param {number} [filters.page] - 1-based, default 1
 * @param {number} [filters.pageSize] - default 50
 * @returns {Promise<{items: object[], total: number, page: number, pageSize: number}>}
 */
export async function listActivities(filters = {}) {
  const { status, priority, front, assignee, q, dueBefore, dueAfter, page = 1, pageSize = 50 } = filters;
  const query = (q || "").trim().toLowerCase();

  let items = state.activities.filter((a) => {
    if (status && a.status !== status) return false;
    if (priority && a.priority !== priority) return false;
    if (front && a.front !== front) return false;
    if (assignee && !a.assignees.includes(assignee)) return false;
    if (dueBefore && a.dueDate && a.dueDate > dueBefore) return false;
    if (dueAfter && a.dueDate && a.dueDate < dueAfter) return false;
    if (query) {
      const frontName = state.fronts.find((f) => f.id === a.front)?.name || "";
      const assigneeNames = a.assignees
        .map((id) => state.members.find((m) => m.id === id)?.name || "")
        .join(" ");
      const hay = `${a.title} ${a.description} ${frontName} ${assigneeNames}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  items.sort((x, y) => (x.dueDate || "").localeCompare(y.dueDate || ""));

  const total = items.length;
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { items: structuredClone(pageItems), total, page, pageSize };
}

export async function getActivity(id) {
  const a = state.activities.find((x) => x.id === id);
  return a ? structuredClone(a) : null;
}

/**
 * @param {object} data - title, description?, front, assignees?, status?, priority?,
 *   progress?, startDate?, dueDate?, estimatedTime?, materials?, createdBy?
 */
export async function createActivity(data) {
  const status = data.status || "todo";
  const activity = {
    id: uid("a"),
    title: data.title,
    description: data.description || "—",
    front: data.front,
    assignees: data.assignees || [],
    status,
    priority: data.priority || "medium",
    progress: data.progress ?? 0,
    startDate: data.startDate || null,
    dueDate: data.dueDate || null,
    estimatedTime: data.estimatedTime || "—",
    materials: data.materials || "—",
    createdBy: data.createdBy || data.assignees?.[0] || null,
    notes: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  state.activities.push(activity);
  logEvent(activity.id, { actorId: activity.createdBy, kind: "created", payload: { front: activity.front } });
  persist();
  emit("activities", "insert");
  return structuredClone(activity);
}

export async function updateActivity(id, patch, opts = {}) {
  const a = state.activities.find((x) => x.id === id);
  if (!a) throw new Error(`Actividad no encontrada: ${id}`);
  const prevStatus = a.status;
  const prevProgress = a.progress;

  Object.assign(a, patch, { updatedAt: nowISO() });
  if (patch.status === "done" && patch.progress === undefined) a.progress = 100;
  else if (patch.status === "todo" && patch.progress === undefined) a.progress = 0;

  if (patch.status !== undefined && patch.status !== prevStatus) {
    logEvent(id, { actorId: opts.actorId || null, kind: "status_changed", payload: { status: a.status, from: prevStatus } });
  } else if (patch.progress !== undefined && patch.progress !== prevProgress) {
    logEvent(id, { actorId: opts.actorId || null, kind: "progress_changed", payload: { progress: a.progress } });
  } else {
    logEvent(id, { actorId: opts.actorId || null, kind: "updated", payload: {} });
  }

  persist();
  emit("activities", "update");
  return structuredClone(a);
}

export async function deleteActivity(id) {
  state.activities = state.activities.filter((x) => x.id !== id);
  state.events = state.events.filter((e) => e.activityId !== id); // mirrors ON DELETE CASCADE
  persist();
  emit("activities", "delete");
}

export async function setActivityAssignees(id, memberIds) {
  const a = state.activities.find((x) => x.id === id);
  if (!a) throw new Error(`Actividad no encontrada: ${id}`);
  a.assignees = [...memberIds];
  a.updatedAt = nowISO();
  persist();
  emit("activities", "update");
  return structuredClone(a);
}

// ----------------------------------------------------------------- notes
export async function listNotes(activityId) {
  const a = state.activities.find((x) => x.id === activityId);
  return a ? structuredClone(a.notes) : [];
}

/**
 * @param {string} activityId
 * @param {{body: string, authorId: string}} note
 */
export async function addNote(activityId, note) {
  const a = state.activities.find((x) => x.id === activityId);
  if (!a) throw new Error(`Actividad no encontrada: ${activityId}`);
  const entry = { id: uid("note"), body: note.body, authorId: note.authorId, createdAt: nowISO() };
  a.notes.push(entry);
  a.updatedAt = nowISO();
  logEvent(activityId, { actorId: note.authorId || null, kind: "note_added", payload: { noteId: entry.id } });
  persist();
  emit("notes", "insert");
  return structuredClone(entry);
}

export async function deleteNote(activityId, noteId) {
  const a = state.activities.find((x) => x.id === activityId);
  if (!a) return;
  a.notes = a.notes.filter((n) => n.id !== noteId);
  persist();
  emit("notes", "delete");
}

// ---------------------------------------------------------------- events
/**
 * @param {{activityId?: string, limit?: number}} [opts] - omit activityId for the global feed
 */
export async function listEvents(opts = {}) {
  const { activityId, limit = 40 } = opts;
  let events = state.events;
  if (activityId) events = events.filter((e) => e.activityId === activityId);

  const enriched = events.slice(0, limit).map((e) => {
    const activity = state.activities.find((a) => a.id === e.activityId);
    const actor = state.members.find((m) => m.id === e.actorId);
    return { ...e, activityTitle: activity?.title || null, actorName: actor?.name || null };
  });
  return structuredClone(enriched);
}

/**
 * @param {{activityId: string, actorId?: string, kind: string, payload?: object}} event
 */
export async function addEvent(event) {
  const entry = logEvent(event.activityId, { actorId: event.actorId, kind: event.kind, payload: event.payload });
  persist();
  emit("events", "insert");
  return structuredClone(entry);
}

// --------------------------------------------------------------- sessions
/**
 * @param {{limit?: number}} [opts]
 * @returns {Promise<object[]>} upcoming Zoom/manual sessions (includes a
 *   2h grace window into the past, so in-progress sessions still show)
 */
export async function listSessions({ limit = 20 } = {}) {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const sessions = state.sessions
    .filter((s) => s.startsAt >= cutoff)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, limit);
  return structuredClone(sessions);
}

/**
 * @param {object} data - title, description?, startsAt, durationMin?, joinUrl?,
 *   host?, source?, createdBy?
 */
export async function createSession(data) {
  const session = {
    id: uid("sess"),
    title: data.title,
    description: data.description || "",
    startsAt: data.startsAt,
    durationMin: data.durationMin ?? null,
    joinUrl: data.joinUrl || null,
    zoomMeetingId: data.zoomMeetingId || null,
    host: data.host || "",
    source: data.source || "manual",
    createdBy: data.createdBy || null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  state.sessions.push(session);
  persist();
  emit("sessions", "INSERT");
  return structuredClone(session);
}

export async function updateSession(id, patch) {
  const session = state.sessions.find((s) => s.id === id);
  if (!session) throw new Error(`Sesión no encontrada: ${id}`);
  Object.assign(session, patch, { updatedAt: nowISO() });
  persist();
  emit("sessions", "UPDATE");
  return structuredClone(session);
}

export async function deleteSession(id) {
  state.sessions = state.sessions.filter((s) => s.id !== id);
  persist();
  emit("sessions", "DELETE");
}

/** Sin Zoom en modo demo: no-op para paridad de interfaz con supabaseRepo. */
export async function syncSessions() {
  return { skipped: true, reason: "demo" };
}

// ---------------------------------------------------------- raw access
// Used by importExport.js to read/replace the whole local dataset.
export function _getRawState() {
  return structuredClone(state);
}

export function _setRawState(next) {
  state = next;
  persist();
  emit("*", "import");
}
