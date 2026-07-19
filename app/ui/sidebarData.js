// Shared query used by fronts.js + team.js to compute per-front average
// progress and per-member active-task counts without each mounting its
// own duplicate fetch — both subscribe to the same cache entry (see
// app/store.js: same key = same entry = one network call, N listeners).
import { listActivities } from "../repo/index.js";
import { getQuery } from "../store.js";

export function getSidebarActivitiesQuery() {
  return getQuery("activities:sidebar-all", () => listActivities({ pageSize: 1000 }).then((r) => r.items));
}
