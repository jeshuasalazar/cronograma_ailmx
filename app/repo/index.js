// Repo façade: picks the localStorage-backed implementation (demo mode)
// or the Supabase-backed one (real credentials present), transparently.
//
// Both `localRepo.js` and `supabaseRepo.js` export the exact same
// function names/signatures over the exact same shape — which mirrors
// the real Supabase schema in `supabase/migrations/001_schema.sql` 1:1
// (camelCase column names), see docs/SUPABASE_SETUP.md for provisioning
// it. This module is the ONLY place that needs to know which
// implementation is active. Everything else (app/store.js, UI code)
// imports from `app/repo/index.js` and never touches the two
// implementations directly.
//
// -------------------------------------------------------------------
// Repo interface (implemented identically by localRepo.js and
// supabaseRepo.js):
//
//   listFronts(): Promise<Front[]>
//   createFront(data: {name, tag?, color?, position?}): Promise<Front>
//   updateFront(id, patch): Promise<Front>
//   deleteFront(id): Promise<void>
//
//   listMembers(): Promise<Member[]>
//   createMember(data: {name, role?, color?, email?, isAdmin?}): Promise<Member>
//   updateMember(id, patch): Promise<Member>
//   deleteMember(id): Promise<void>
//
//   listActivities(filters?: {
//     status?, priority?, front?, assignee?, q?, dueBefore?, dueAfter?,
//     page?: number (default 1), pageSize?: number (default 50)
//   }): Promise<{items: Activity[], total: number, page: number, pageSize: number}>
//   getActivity(id): Promise<Activity|null>
//   createActivity(data: {title, description?, front, assignees?, status?,
//     priority?, progress?, startDate?, dueDate?, estimatedTime?, materials?,
//     createdBy?}): Promise<Activity>
//     - auto-logs an activity_events row of kind "created"
//   updateActivity(id, patch, opts?: {actorId?}): Promise<Activity>
//     - auto-logs "status_changed" | "progress_changed" | "updated"
//   deleteActivity(id): Promise<void>
//   setActivityAssignees(id, memberIds: string[]): Promise<Activity>
//
//   listNotes(activityId): Promise<Note[]>
//   addNote(activityId, note: {body, authorId}): Promise<Note>
//     - auto-logs an activity_events row of kind "note_added"
//   deleteNote(activityId, noteId): Promise<void>
//
//   listEvents(opts?: {activityId?: string, limit?: number}): Promise<Event[]>
//     - omit activityId for the global "Actividad reciente" feed across all activities
//   addEvent(event: {activityId, actorId?, kind, payload?}): Promise<Event>
//     - manual/custom event; the auto-logged kinds above cover the common cases
//
//   listSessions(opts?: {limit?: number}): Promise<Session[]>
//     - upcoming Zoom/manual sessions, ordered by startsAt ascending
//       (includes a 2h grace window into the past so in-progress
//       sessions still show)
//   createSession(data: {title, description?, startsAt, durationMin?,
//     joinUrl?, zoomMeetingId?, host?, source?, createdBy?}): Promise<Session>
//   updateSession(id, patch): Promise<Session>
//   deleteSession(id): Promise<void>
//
//   subscribe(cb: (change: {table: string, type: string}) => void): () => void
//
// Shapes (camelCase, identical from both backends — 1:1 with the SQL
// schema's columns, snake_case -> camelCase):
//   Front    = { id, name, tag, color, position }
//   Member   = { id, name, role, color, email, authUserId, isAdmin }
//   Activity = { id, title, description, front, assignees: string[],
//                status: 'todo'|'prog'|'wait'|'done',
//                priority: 'low'|'medium'|'high'|'urgent', progress: number,
//                startDate, dueDate, estimatedTime, materials, createdBy,
//                notes: Note[], createdAt, updatedAt }
//   Note     = { id, activityId, body, authorId, createdAt }
//   Event    = { id, activityId, activityTitle, actorId, actorName, kind, payload, createdAt }
//   Session  = { id, title, description, startsAt, durationMin, joinUrl,
//                zoomMeetingId, host, source: 'zoom'|'manual', createdBy,
//                createdAt, updatedAt }
// -------------------------------------------------------------------
import { isDemoMode } from "../supabaseClient.js";
import * as localRepo from "./localRepo.js";
import * as supabaseRepo from "./supabaseRepo.js";

export const repo = isDemoMode ? localRepo : supabaseRepo;

// Re-exported individually too, for `import { listActivities } from
// "./repo/index.js"` style call sites.
export const {
  listFronts,
  createFront,
  updateFront,
  deleteFront,
  listMembers,
  createMember,
  updateMember,
  deleteMember,
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  setActivityAssignees,
  listNotes,
  addNote,
  deleteNote,
  listEvents,
  addEvent,
  listSessions,
  createSession,
  updateSession,
  deleteSession,
  syncSessions,
  subscribe,
} = repo;
