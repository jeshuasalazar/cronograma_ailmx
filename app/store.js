// Tiny react-query-style cache, framework-agnostic (no React/Vue
// dependency — plain subscribe/notify). Sits between the UI and
// `app/repo/index.js`.
//
// Query keys: a string. For parametrized queries (filters, pagination)
// build the key yourself so it's unique per param combo, e.g.
//   getQuery(`activities:${JSON.stringify(filters)}`, () => listActivities(filters))
// `invalidate()` does prefix matching on `:`, so invalidating "activities"
// invalidates every "activities:..." key too (see below).
//
// -------------------------------------------------------------------
// getQuery(key, fetcher, opts?) -> QueryHandle
//   fetcher: (ctx: {signal: AbortSignal}) => Promise<any>
//   opts.lazy?: boolean - if true, does not auto-fetch on first access;
//     caller must call handle.refetch().
//   QueryHandle:
//     .key: string
//     .getState(): {status: 'idle'|'loading'|'success'|'error', data, error, optimistic?: boolean}
//     .subscribe(cb: (state) => void): () => void   // cb fires immediately with current state, then on every change
//     .refetch(): Promise<any>
//
// invalidate(keys: string | string[]): void
//   Marks matching queries stale. Queries with active subscribers
//   refetch immediately; queries with none are just marked 'idle' so
//   they refetch next time they're accessed.
//
// mutate(mutationFn, opts?): Promise<any>
//   mutationFn: () => Promise<any> - the actual repo call (e.g. updateActivity)
//   opts.optimistic?: { [key: string]: (prevData) => newData } - applied
//     to the named cache entries synchronously, before mutationFn runs
//   opts.rollback?: (error) => void - extra rollback logic beyond the
//     automatic cache revert (e.g. resetting a form field)
//   opts.invalidates?: string[] - keys/prefixes to invalidate on success
// -------------------------------------------------------------------

const store = new Map(); // key -> entry

function createEntry(key) {
  return {
    key,
    state: { status: "idle", data: undefined, error: null },
    listeners: new Set(),
    version: 0,
    fetcher: null,
    controller: null,
  };
}

function notify(entry) {
  for (const cb of entry.listeners) cb(entry.state);
}

function setState(entry, patch) {
  entry.state = { ...entry.state, ...patch };
  notify(entry);
}

function triggerFetch(entry) {
  if (!entry.fetcher) return Promise.resolve(entry.state.data);

  entry.controller?.abort();
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  entry.controller = controller;
  const myVersion = ++entry.version;

  setState(entry, { status: "loading", error: null, optimistic: false });

  return Promise.resolve()
    .then(() => entry.fetcher({ signal: controller?.signal }))
    .then((data) => {
      if (myVersion !== entry.version) return entry.state.data; // superseded by a newer call
      setState(entry, { status: "success", data, error: null, optimistic: false });
      return data;
    })
    .catch((error) => {
      if (myVersion !== entry.version) return; // superseded
      if (error?.name === "AbortError") return;
      setState(entry, { status: "error", error });
      throw error;
    });
}

/**
 * @param {string} key
 * @param {(ctx: {signal: AbortSignal|undefined}) => Promise<any>} fetcher
 * @param {{lazy?: boolean}} [opts]
 */
export function getQuery(key, fetcher, opts = {}) {
  let entry = store.get(key);
  if (!entry) {
    entry = createEntry(key);
    store.set(key, entry);
  }
  entry.fetcher = fetcher; // always refresh closure (filters may have changed)

  if (!opts.lazy && entry.state.status === "idle") {
    triggerFetch(entry);
  }

  return {
    key,
    getState: () => entry.state,
    subscribe(cb) {
      entry.listeners.add(cb);
      cb(entry.state);
      return () => entry.listeners.delete(cb);
    },
    refetch: () => triggerFetch(entry),
  };
}

function matchesPrefix(entryKey, prefix) {
  return entryKey === prefix || entryKey.startsWith(`${prefix}:`);
}

/**
 * @param {string | string[]} keys
 */
export function invalidate(keys) {
  const prefixes = Array.isArray(keys) ? keys : [keys];
  for (const entry of store.values()) {
    if (!prefixes.some((p) => matchesPrefix(entry.key, p))) continue;
    if (entry.listeners.size > 0) {
      triggerFetch(entry);
    } else {
      setState(entry, { status: "idle" });
    }
  }
}

/**
 * @param {() => Promise<any>} mutationFn
 * @param {{optimistic?: Record<string, (prev: any) => any>, rollback?: (error: any) => void, invalidates?: string[]}} [opts]
 */
export async function mutate(mutationFn, opts = {}) {
  const { optimistic, rollback, invalidates = [] } = opts;
  const snapshots = new Map();

  if (optimistic) {
    for (const [key, updater] of Object.entries(optimistic)) {
      const entry = store.get(key);
      if (!entry) continue;
      snapshots.set(key, entry.state);
      setState(entry, { data: updater(entry.state.data), optimistic: true });
    }
  }

  try {
    const result = await mutationFn();
    if (invalidates.length) invalidate(invalidates);
    return result;
  } catch (error) {
    for (const [key, prevState] of snapshots) {
      const entry = store.get(key);
      if (entry) {
        entry.state = prevState;
        notify(entry);
      }
    }
    rollback?.(error);
    throw error;
  }
}

/** Test/debug helper: drop everything (cache + subscribers untouched by listeners still holding old handles). */
export function _resetStore() {
  store.clear();
}
