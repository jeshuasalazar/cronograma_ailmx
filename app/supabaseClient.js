// Supabase client bootstrap.
//
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from the Vite env
// (define them in a `.env` / `.env.local` file, or as real env vars in
// Railway — anything prefixed VITE_ is inlined into the client bundle at
// build time). If either is missing we fall back to "demo mode": no
// Supabase client is created, and the rest of the app (auth, repo,
// store) reads `isDemoMode` to swap in the localStorage-backed repo and
// a simulated session instead of failing.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isDemoMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const supabase = isDemoMode
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

if (isDemoMode && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    "[aiLearning] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no definidas — arrancando en modo demo (datos locales).",
  );
}
