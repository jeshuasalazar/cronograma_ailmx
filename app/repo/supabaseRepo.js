// Supabase-backed implementation of the repo interface (see
// `app/repo/index.js` for the shared contract with `localRepo.js`).
//
// Talks to the REAL schema created by supabase/migrations/001-004 (see
// docs/SUPABASE_SETUP.md for how to provision it):
//
//   fronts(id, name, tag, color, position, created_at)
//   team_members(id, name, email, auth_user_id, is_admin, role, color, created_at)
//   activities(id, title, description, front_id, status, priority, progress,
//     start_date, due_date, estimated_time, materials, created_by,
//     created_at, updated_at)
//   activity_assignees(activity_id, team_member_id, assigned_at)
//   activity_notes(id, activity_id, author_id, body, created_at)
//   activity_events(id, activity_id, actor_id, kind, payload jsonb, created_at)
//
// `status` values: todo|prog|wait|done (unchanged from the legacy panel).
// `priority` values: low|medium|high|urgent (NEW column — legacy panel had none).
//
// Row-level shapes returned by every function here match localRepo.js
// exactly (camelCase, `assignees` as an array of team_member ids, `notes`
// embedded on activities) so the UI layer never needs to know which
// backend is active. `activity_events` is per-activity in the DB;
// listEvents() without an `activityId` filter reproduces the legacy
// panel's global "Actividad reciente" feed by querying across all
// activities and joining in the activity title + actor name.
import { supabase } from "../supabaseClient.js";

function mapFront(row) {
  return { id: row.id, name: row.name, tag: row.tag || "", color: row.color || "", position: row.position ?? 0 };
}

function mapMember(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role || "",
    color: row.color || "#4C9BF0",
    email: row.email || null,
    authUserId: row.auth_user_id || null,
    isAdmin: !!row.is_admin,
  };
}

function mapNote(row) {
  return { id: row.id, activityId: row.activity_id, body: row.body, authorId: row.author_id, createdAt: row.created_at };
}

function mapActivity(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    front: row.front_id,
    assignees: (row.activity_assignees || []).map((r) => r.team_member_id),
    status: row.status,
    priority: row.priority,
    progress: row.progress,
    startDate: row.start_date,
    dueDate: row.due_date,
    estimatedTime: row.estimated_time || "",
    materials: row.materials || "",
    createdBy: row.created_by,
    notes: (row.activity_notes || []).map(mapNote).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row) {
  return {
    id: row.id,
    activityId: row.activity_id,
    activityTitle: row.activities?.title ?? null,
    actorId: row.actor_id,
    actorName: row.team_members?.name ?? null,
    kind: row.kind,
    payload: row.payload || {},
    createdAt: row.created_at,
  };
}

function throwIfError(error, context) {
  if (error) throw new Error(`[aiLearning] supabaseRepo ${context}: ${error.message}`);
}

const ACTIVITY_SELECT = "*, activity_assignees(team_member_id), activity_notes(*)";

// ---------------------------------------------------------------- fronts
export async function listFronts() {
  const { data, error } = await supabase.from("fronts").select("*").order("position");
  throwIfError(error, "listFronts");
  return data.map(mapFront);
}

export async function createFront(data) {
  const { data: row, error } = await supabase
    .from("fronts")
    .insert({ name: data.name, tag: data.tag || "", color: data.color || null, position: data.position ?? 0 })
    .select()
    .single();
  throwIfError(error, "createFront");
  return mapFront(row);
}

export async function updateFront(id, patch) {
  const { data: row, error } = await supabase.from("fronts").update(patch).eq("id", id).select().single();
  throwIfError(error, "updateFront");
  return mapFront(row);
}

export async function deleteFront(id) {
  const { error } = await supabase.from("fronts").delete().eq("id", id);
  throwIfError(error, "deleteFront");
}

// --------------------------------------------------------------- members
export async function listMembers() {
  const { data, error } = await supabase.from("team_members").select("*").order("name");
  throwIfError(error, "listMembers");
  return data.map(mapMember);
}

export async function createMember(data) {
  const { data: row, error } = await supabase
    .from("team_members")
    .insert({
      name: data.name,
      role: data.role || "",
      color: data.color || "#4C9BF0",
      email: data.email || null,
      is_admin: !!data.isAdmin,
    })
    .select()
    .single();
  throwIfError(error, "createMember");
  return mapMember(row);
}

export async function updateMember(id, patch) {
  const dbPatch = { ...patch };
  if ("isAdmin" in dbPatch) {
    dbPatch.is_admin = dbPatch.isAdmin;
    delete dbPatch.isAdmin;
  }
  if ("authUserId" in dbPatch) {
    dbPatch.auth_user_id = dbPatch.authUserId;
    delete dbPatch.authUserId;
  }
  const { data: row, error } = await supabase.from("team_members").update(dbPatch).eq("id", id).select().single();
  throwIfError(error, "updateMember");
  return mapMember(row);
}

export async function deleteMember(id) {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  throwIfError(error, "deleteMember");
}

// ------------------------------------------------------------ activities
/**
 * @param {object} [filters]
 * @param {string} [filters.status]
 * @param {string} [filters.priority]
 * @param {string} [filters.front] - front id
 * @param {string} [filters.assignee] - team_member id
 * @param {string} [filters.q] - free-text search (title/description, via ilike; uses the trigram GIN index)
 * @param {string} [filters.dueBefore] - ISO date, inclusive
 * @param {string} [filters.dueAfter] - ISO date, inclusive
 * @param {number} [filters.page] - 1-based, default 1
 * @param {number} [filters.pageSize] - default 50
 * @returns {Promise<{items: object[], total: number, page: number, pageSize: number}>}
 */
export async function listActivities(filters = {}) {
  const { status, priority, front, assignee, q, dueBefore, dueAfter, page = 1, pageSize = 50 } = filters;

  let query = supabase.from("activities").select(ACTIVITY_SELECT, { count: "exact" });

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (front) query = query.eq("front_id", front);
  if (dueBefore) query = query.lte("due_date", dueBefore);
  if (dueAfter) query = query.gte("due_date", dueAfter);
  if (q && q.trim()) query = query.or(`title.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`);
  if (assignee) {
    // narrows the embedded join rows; belt-and-suspenders client-side
    // filter below covers setups where PostgREST doesn't also narrow parents
    query = query.eq("activity_assignees.team_member_id", assignee);
  }

  const start = (page - 1) * pageSize;
  query = query.order("due_date", { ascending: true, nullsFirst: false }).range(start, start + pageSize - 1);

  const { data, error, count } = await query;
  throwIfError(error, "listActivities");

  let items = data.map(mapActivity);
  if (assignee) items = items.filter((a) => a.assignees.includes(assignee));

  return { items, total: count ?? items.length, page, pageSize };
}

export async function getActivity(id) {
  const { data, error } = await supabase.from("activities").select(ACTIVITY_SELECT).eq("id", id).maybeSingle();
  throwIfError(error, "getActivity");
  return data ? mapActivity(data) : null;
}

/**
 * @param {object} data - title, description?, front, assignees?, status?, priority?,
 *   progress?, startDate?, dueDate?, estimatedTime?, materials?, createdBy?
 */
export async function createActivity(data) {
  const createdBy = data.createdBy || data.assignees?.[0] || null;
  const { data: row, error } = await supabase
    .from("activities")
    .insert({
      title: data.title,
      description: data.description || "",
      front_id: data.front,
      status: data.status || "todo",
      priority: data.priority || "medium",
      progress: data.progress ?? 0,
      start_date: data.startDate || null,
      due_date: data.dueDate || null,
      estimated_time: data.estimatedTime || "",
      materials: data.materials || "",
      created_by: createdBy,
    })
    .select(ACTIVITY_SELECT)
    .single();
  throwIfError(error, "createActivity");

  if (data.assignees?.length) await setActivityAssignees(row.id, data.assignees);
  await addEvent({ activityId: row.id, actorId: createdBy, kind: "created", payload: { front: data.front } });
  return getActivity(row.id);
}

export async function updateActivity(id, patch, opts = {}) {
  const before = await getActivity(id);
  if (!before) throw new Error(`Actividad no encontrada: ${id}`);

  const dbPatch = { ...patch, updated_at: new Date().toISOString() };
  if ("front" in dbPatch) {
    dbPatch.front_id = dbPatch.front;
    delete dbPatch.front;
  }
  if ("startDate" in dbPatch) {
    dbPatch.start_date = dbPatch.startDate;
    delete dbPatch.startDate;
  }
  if ("dueDate" in dbPatch) {
    dbPatch.due_date = dbPatch.dueDate;
    delete dbPatch.dueDate;
  }
  if ("estimatedTime" in dbPatch) {
    dbPatch.estimated_time = dbPatch.estimatedTime;
    delete dbPatch.estimatedTime;
  }
  if (patch.status === "done" && patch.progress === undefined) dbPatch.progress = 100;
  else if (patch.status === "todo" && patch.progress === undefined) dbPatch.progress = 0;
  delete dbPatch.assignees; // handled separately via setActivityAssignees
  delete dbPatch.notes; // notes are managed via addNote/deleteNote

  const { error } = await supabase.from("activities").update(dbPatch).eq("id", id);
  throwIfError(error, "updateActivity");

  if (patch.assignees) await setActivityAssignees(id, patch.assignees);

  if (patch.status !== undefined && patch.status !== before.status) {
    await addEvent({ activityId: id, actorId: opts.actorId, kind: "status_changed", payload: { status: patch.status, from: before.status } });
  } else if (patch.progress !== undefined && patch.progress !== before.progress) {
    await addEvent({ activityId: id, actorId: opts.actorId, kind: "progress_changed", payload: { progress: patch.progress } });
  } else {
    await addEvent({ activityId: id, actorId: opts.actorId, kind: "updated", payload: {} });
  }

  return getActivity(id);
}

export async function deleteActivity(id) {
  // activity_events/activity_notes/activity_assignees all cascade on
  // delete (see 001_schema.sql), so no manual cleanup needed here.
  const { error } = await supabase.from("activities").delete().eq("id", id);
  throwIfError(error, "deleteActivity");
}

export async function setActivityAssignees(id, memberIds) {
  const { error: delError } = await supabase.from("activity_assignees").delete().eq("activity_id", id);
  throwIfError(delError, "setActivityAssignees(delete)");

  if (memberIds.length) {
    const { error: insError } = await supabase
      .from("activity_assignees")
      .insert(memberIds.map((teamMemberId) => ({ activity_id: id, team_member_id: teamMemberId })));
    throwIfError(insError, "setActivityAssignees(insert)");
  }
  return getActivity(id);
}

// ----------------------------------------------------------------- notes
export async function listNotes(activityId) {
  const { data, error } = await supabase
    .from("activity_notes")
    .select("*")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });
  throwIfError(error, "listNotes");
  return data.map(mapNote);
}

/**
 * @param {string} activityId
 * @param {{body: string, authorId: string}} note
 */
export async function addNote(activityId, note) {
  const { data: row, error } = await supabase
    .from("activity_notes")
    .insert({ activity_id: activityId, body: note.body, author_id: note.authorId })
    .select()
    .single();
  throwIfError(error, "addNote");
  await supabase.from("activities").update({ updated_at: new Date().toISOString() }).eq("id", activityId);
  await addEvent({ activityId, actorId: note.authorId, kind: "note_added", payload: { noteId: row.id } });
  return mapNote(row);
}

export async function deleteNote(activityId, noteId) {
  const { error } = await supabase.from("activity_notes").delete().eq("id", noteId);
  throwIfError(error, "deleteNote");
}

// ---------------------------------------------------------------- events
/**
 * @param {{activityId?: string, limit?: number}} [opts] - omit activityId for the global feed
 */
export async function listEvents(opts = {}) {
  const { activityId, limit = 40 } = opts;
  let query = supabase
    .from("activity_events")
    .select("*, activities(title), team_members(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (activityId) query = query.eq("activity_id", activityId);

  const { data, error } = await query;
  throwIfError(error, "listEvents");
  return data.map(mapEvent);
}

/**
 * @param {{activityId: string, actorId?: string, kind: string, payload?: object}} event
 */
export async function addEvent(event) {
  const { data: row, error } = await supabase
    .from("activity_events")
    .insert({
      activity_id: event.activityId,
      actor_id: event.actorId || null,
      kind: event.kind,
      payload: event.payload || {},
    })
    .select("*, activities(title), team_members(name)")
    .single();
  throwIfError(error, "addEvent");
  return mapEvent(row);
}

// ------------------------------------------------------------- realtime
/**
 * Subscribe to Realtime changes on activities/activity_assignees/
 * activity_notes/activity_events (all four are added to the
 * `supabase_realtime` publication in 003_rls.sql). Fires the callback
 * with `{table, type}` invalidation hints — same shape as localRepo's
 * subscribe() — so `app/store.js` can call `invalidate([...])`
 * generically regardless of backend.
 *
 * @param {(change: {table: string, type: string}) => void} cb
 * @returns {() => void} unsubscribe
 */
export function subscribe(cb) {
  const channel = supabase
    .channel("ops-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, (payload) =>
      cb({ table: "activities", type: payload.eventType }),
    )
    .on("postgres_changes", { event: "*", schema: "public", table: "activity_assignees" }, (payload) =>
      cb({ table: "activities", type: payload.eventType }),
    )
    .on("postgres_changes", { event: "*", schema: "public", table: "activity_notes" }, (payload) =>
      cb({ table: "notes", type: payload.eventType }),
    )
    .on("postgres_changes", { event: "*", schema: "public", table: "activity_events" }, (payload) =>
      cb({ table: "events", type: payload.eventType }),
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
