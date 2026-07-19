// Import/export utilities:
//  - exportJSON(): dump the active repo's full dataset (works against
//    either localRepo or supabaseRepo, since both share the same
//    interface) as a plain JSON-serializable object.
//  - importJSON(data): load a dataset — either already in the new
//    shape (as produced by exportJSON) or the legacy panel's
//    "ail_ops_v2" localStorage shape — into a target repo (defaults to
//    the currently active one, so this doubles as the localStorage
//    v2 -> v3/Supabase migration path).
//  - readLegacyV2(): convenience reader for the old panel's
//    localStorage key, so a "Migrar datos antiguos" UI button can do
//    `importJSON(readLegacyV2())` in one line.
import { seedFronts, seedMembers } from "./seedData.js";
import * as activeRepo from "./index.js";

const LEGACY_KEY = "ail_ops_v2";

// legacy numeric front id (0-3) -> seedFronts id, same order as the
// hardcoded FRONTS const in the legacy panel HTML.
const LEGACY_FRONT_ID_BY_INDEX = seedFronts.map((f) => f.id);
// legacy TEAM member id -> seedMembers id ("jhua" the string id -> "jeshua",
// the real name; see supabase/migrations/004_seed.sql's note #2).
const LEGACY_MEMBER_ID_MAP = { blake: "cp-blake", roberto: "cp-roberto", jhua: "jeshua" };
// legacy status -> new priority heuristic, IDENTICAL to the one used in
// supabase/migrations/004_seed.sql: wait->high, done->low, prog/todo->medium.
const PRIORITY_BY_STATUS = { wait: "high", done: "low", prog: "medium", todo: "medium" };

/** Read the legacy panel's raw localStorage payload, if present. */
export function readLegacyV2() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.acts) ? parsed : null;
  } catch {
    return null;
  }
}

function isLegacyShape(data) {
  return !!data && Array.isArray(data.acts);
}

/**
 * Convert the legacy panel's flat shape
 * ({acts:[{id,day,date,title,front:<0-3>,owners:[...],task,time,mat,status,prog,
 *   notes:[{t,by,ts}]}], feed:[{txt,ts,dot}]})
 * into the new relational shape (1:1 with the Supabase schema — see
 * seedData.js's header comment for the full field mapping).
 *
 * Legacy `day` (day-of-month int) + `date` (free-text range, e.g.
 * "01 – 07 JUL 2026") don't map cleanly to real startDate/dueDate columns
 * without re-parsing free text per-locale, so this migration leaves both
 * null — same as the manual migration report's approach, edit dates by
 * hand after import if precision matters. Legacy global feed entries
 * (`state.feed`, plain text like "<b>Title</b> cambió a <b>Done</b>.")
 * aren't tied to a structured activity id, and activity_events.activity_id
 * is NOT NULL in the real schema, so each feed entry is matched
 * best-effort to an activity by looking for that activity's title inside
 * the entry's text; entries that don't match any activity are dropped
 * (logged to console) rather than violating the NOT NULL constraint.
 *
 * @param {object} legacy
 * @returns {{fronts: object[], members: object[], activities: object[], events: object[]}}
 */
export function migrateLegacyV2(legacy) {
  const activities = (legacy.acts || []).map((a) => {
    const owners = (a.owners || []).map((id) => LEGACY_MEMBER_ID_MAP[id] || id);
    return {
      id: a.id,
      title: a.title,
      description: a.task || "",
      front: LEGACY_FRONT_ID_BY_INDEX[a.front] ?? LEGACY_FRONT_ID_BY_INDEX[0],
      assignees: owners,
      status: a.status,
      priority: PRIORITY_BY_STATUS[a.status] || "medium",
      progress: a.prog,
      startDate: null,
      dueDate: null,
      estimatedTime: a.time || "",
      materials: a.mat || "",
      createdBy: owners[0] || null,
      notes: (a.notes || []).map((n, i) => ({
        id: `${a.id}-n${i + 1}`,
        body: n.t,
        authorId: LEGACY_MEMBER_ID_MAP[n.by] || n.by,
        createdAt: new Date(n.ts).toISOString(),
      })),
      createdAt: new Date(legacy.lastSync || Date.now()).toISOString(),
      updatedAt: new Date(legacy.lastSync || Date.now()).toISOString(),
    };
  });

  const events = [];
  for (let i = 0; i < (legacy.feed || []).length; i++) {
    const f = legacy.feed[i];
    const plainText = String(f.txt || "").replace(/<[^>]+>/g, "");
    const matched = activities.find((a) => plainText.includes(a.title));
    if (!matched) {
      // eslint-disable-next-line no-console
      console.warn(`[aiLearning] importExport: evento del feed sin actividad asociada, se omite: "${plainText}"`);
      continue;
    }
    events.push({
      id: `event-legacy-${i}`,
      activityId: matched.id,
      actorId: matched.assignees[0] || null,
      kind: "legacy_feed",
      payload: { text: plainText },
      createdAt: new Date(f.ts).toISOString(),
    });
  }

  // Legacy FRONTS/TEAM were hardcoded consts, never stored in
  // localStorage — reuse seedData's copy of the same consts.
  return { fronts: seedFronts, members: seedMembers, activities, events };
}

/**
 * Export the full dataset from a repo (defaults to the currently active
 * one — local or Supabase, whichever is live) in a plain JSON shape
 * suitable for download / later importJSON().
 *
 * @param {object} [repo] - a repo implementation (see app/repo/index.js); defaults to the active one.
 */
export async function exportJSON(repo = activeRepo) {
  const [fronts, members, events, { items: activities }] = await Promise.all([
    repo.listFronts(),
    repo.listMembers(),
    repo.listEvents({ limit: 1000 }),
    repo.listActivities({ page: 1, pageSize: 10000 }),
  ]);
  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    fronts,
    members,
    activities,
    events,
  };
}

/**
 * Import a dataset into a target repo (defaults to the active one).
 * Accepts either the new shape (exportJSON output) or the legacy
 * "ail_ops_v2" shape (auto-detected and migrated via migrateLegacyV2).
 *
 * Fronts/members are matched by name against what's already in the
 * target repo — existing rows are reused (their real ids), missing ones
 * are created — so this is safe to run against a fresh Supabase project
 * (fronts/members don't yet exist) or against localRepo (they already
 * do, from the seed).
 *
 * @param {object} data
 * @param {object} [repo] - a repo implementation; defaults to the active one.
 * @returns {Promise<{fronts: number, members: number, activities: number, notes: number, events: number}>}
 */
export async function importJSON(data, repo = activeRepo) {
  const payload = isLegacyShape(data) ? migrateLegacyV2(data) : data;
  const { fronts = [], members = [], activities = [], events = [] } = payload;

  const idMap = { fronts: new Map(), members: new Map(), activities: new Map() };

  const [existingFronts, existingMembers] = await Promise.all([repo.listFronts(), repo.listMembers()]);
  const frontByName = new Map(existingFronts.map((f) => [f.name, f.id]));
  const memberByName = new Map(existingMembers.map((m) => [m.name, m.id]));

  for (const f of fronts) {
    const existingId = frontByName.get(f.name);
    if (existingId) {
      idMap.fronts.set(f.id, existingId);
    } else {
      const created = await repo.createFront({ name: f.name, tag: f.tag, color: f.color, position: f.position });
      idMap.fronts.set(f.id, created.id);
      frontByName.set(f.name, created.id);
    }
  }

  for (const m of members) {
    const existingId = memberByName.get(m.name);
    if (existingId) {
      idMap.members.set(m.id, existingId);
    } else {
      const created = await repo.createMember({ name: m.name, role: m.role, color: m.color, email: m.email, isAdmin: m.isAdmin });
      idMap.members.set(m.id, created.id);
      memberByName.set(m.name, created.id);
    }
  }

  const mapFrontId = (id) => idMap.fronts.get(id) || id;
  const mapMemberId = (id) => (id ? idMap.members.get(id) || id : id);

  let notesCount = 0;
  for (const a of activities) {
    const created = await repo.createActivity({
      title: a.title,
      description: a.description,
      front: mapFrontId(a.front),
      assignees: (a.assignees || []).map(mapMemberId),
      status: a.status,
      priority: a.priority,
      progress: a.progress,
      startDate: a.startDate,
      dueDate: a.dueDate,
      estimatedTime: a.estimatedTime,
      materials: a.materials,
      createdBy: mapMemberId(a.createdBy),
    });
    idMap.activities.set(a.id, created.id);
    for (const n of a.notes || []) {
      await repo.addNote(created.id, { body: n.body, authorId: mapMemberId(n.authorId) });
      notesCount += 1;
    }
  }

  let eventsCount = 0;
  for (const e of events) {
    const activityId = idMap.activities.get(e.activityId);
    if (!activityId) continue; // orphaned event (activity failed to import) — skip rather than violate NOT NULL
    await repo.addEvent({ activityId, actorId: mapMemberId(e.actorId), kind: e.kind, payload: e.payload });
    eventsCount += 1;
  }

  return {
    fronts: idMap.fronts.size,
    members: idMap.members.size,
    activities: activities.length,
    notes: notesCount,
    events: eventsCount,
  };
}
