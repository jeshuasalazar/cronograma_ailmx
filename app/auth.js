// Auth layer over Supabase Auth, with a demo-mode fallback so the panel
// is fully usable (with local data) when Supabase env vars aren't set.
import { supabase, isDemoMode } from "./supabaseClient.js";
import { listMembers } from "./repo/index.js";

const DEMO_SESSION = {
  user: {
    id: "demo-user",
    email: "demo@ailearning.mx",
    user_metadata: { name: "Demo" },
  },
  demo: true,
};

let currentSession = null;
const listeners = new Set();

function notify() {
  for (const cb of listeners) cb(currentSession);
}

/**
 * Resolve the current session before the app decides whether to show the
 * login screen or the panel. Always resolves (never rejects) — auth
 * errors just leave `currentSession` null (i.e. "show login").
 *
 * @returns {Promise<object|null>} the resolved session, or null if signed out.
 */
export async function initAuth() {
  if (isDemoMode) {
    currentSession = DEMO_SESSION;
    notify();
    return currentSession;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[aiLearning] initAuth getSession error:", error.message);
    currentSession = null;
  } else {
    currentSession = data.session;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    currentSession = session;
    notify();
  });

  notify();
  return currentSession;
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{session: object|null, error: Error|null}>}
 */
export async function signIn(email, password) {
  if (isDemoMode) {
    currentSession = DEMO_SESSION;
    notify();
    return { session: currentSession, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { session: null, error };

  currentSession = data.session;
  notify();
  return { session: currentSession, error: null };
}

/**
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOut() {
  if (isDemoMode) {
    currentSession = null;
    notify();
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  currentSession = null;
  notify();
  return { error };
}

/**
 * Subscribe to session changes (sign in / sign out / token refresh).
 * @param {(session: object|null) => void} cb
 * @returns {() => void} unsubscribe function
 */
export function onAuthChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Synchronous getter for the last-known session (no network call). */
export function getCurrentSession() {
  return currentSession;
}

/**
 * Resolve the current Supabase Auth session to its `team_members` row.
 *
 * IMPORTANT: `activities.created_by`, `activity_notes.author_id` and
 * `activity_events.actor_id` all reference `team_members(id)` — NOT the
 * Supabase Auth user id (`session.user.id`). Any mutation that needs to
 * attribute an action to "whoever is logged in" (addNote's `authorId`,
 * updateActivity's `opts.actorId`, createActivity's `createdBy`) must
 * resolve it through here first, e.g.:
 *
 *   const me = await getCurrentMember();
 *   await addNote(activityId, { body, authorId: me?.id });
 *
 * In demo mode there's no real auth_user_id linkage, so this falls back
 * to the seed's admin member ("Jeshua") so mutations still have a
 * plausible actor.
 *
 * @param {object} [session] - defaults to the last-known session.
 * @returns {Promise<object|null>} the matching Member (see app/repo/index.js shapes), or null.
 */
export async function getCurrentMember(session = currentSession) {
  if (!session) return null;
  const members = await listMembers();
  if (isDemoMode) return members.find((m) => m.isAdmin) || members[0] || null;
  return members.find((m) => m.authUserId === session.user.id) || null;
}
