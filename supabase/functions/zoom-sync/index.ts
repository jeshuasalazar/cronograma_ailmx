// supabase/functions/zoom-sync/index.ts
//
// Sincroniza las reuniones "upcoming" de Zoom (vía Server-to-Server OAuth) a la
// tabla `sessions`. Pensada para ser invocada por un cron de pg_cron
// (ver migración 006) cada 15 minutos, pero también puede llamarse manualmente.
//
// Ver docs/ZOOM_SYNC.md para la guía completa de configuración.

// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  // incluye apikey + x-client-info para permitir la invocación desde el
  // navegador vía supabase.functions.invoke (page-open sync).
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

interface ZoomMeeting {
  id: number | string;
  topic?: string;
  start_time?: string;
  duration?: number;
  join_url?: string;
  host_email?: string;
}

interface SessionRow {
  title: string;
  starts_at: string;
  duration_min: number | null;
  join_url: string | null | undefined;
  zoom_meeting_id: string;
  host: string | null;
  source: "zoom";
}

async function getZoomAccessToken(
  accountId: string,
  clientId: string,
  clientSecret: string,
): Promise<{ token?: string; error?: string }> {
  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    return { error: `zoom_oauth_failed: ${res.status} ${text}` };
  }

  const data = await res.json();
  if (!data.access_token) {
    return { error: "zoom_oauth_failed: no access_token in response" };
  }

  return { token: data.access_token };
}

async function fetchAllUpcomingMeetings(accessToken: string): Promise<ZoomMeeting[]> {
  const meetings: ZoomMeeting[] = [];
  let nextPageToken = "";

  do {
    const url = new URL("https://api.zoom.us/v2/users/me/meetings");
    url.searchParams.set("type", "upcoming");
    url.searchParams.set("page_size", "100");
    if (nextPageToken) {
      url.searchParams.set("next_page_token", nextPageToken);
    }

    const res = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`zoom_meetings_fetch_failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const pageMeetings: ZoomMeeting[] = Array.isArray(data.meetings) ? data.meetings : [];
    meetings.push(...pageMeetings);

    nextPageToken = data.next_page_token ?? "";
  } while (nextPageToken);

  return meetings;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ZOOM_ACCOUNT_ID = Deno.env.get("ZOOM_ACCOUNT_ID");
    const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID");
    const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET");

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return jsonResponse({ skipped: true, reason: "zoom_credentials_missing" }, 200);
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "missing_supabase_env" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Token OAuth Server-to-Server
    const { token, error: tokenError } = await getZoomAccessToken(
      ZOOM_ACCOUNT_ID,
      ZOOM_CLIENT_ID,
      ZOOM_CLIENT_SECRET,
    );

    if (!token) {
      return jsonResponse({ error: tokenError ?? "zoom_oauth_failed" }, 502);
    }

    // 2. Traer todas las reuniones próximas (paginado)
    const meetings = await fetchAllUpcomingMeetings(token);

    // 3. Construir filas para `sessions`, omitiendo meetings sin start_time
    const rows: SessionRow[] = meetings
      .filter((m) => !!m.start_time)
      .map((m) => ({
        title: m.topic ?? "(sin título)",
        starts_at: m.start_time as string,
        duration_min: m.duration ?? null,
        join_url: m.join_url,
        zoom_meeting_id: String(m.id),
        host: m.host_email ?? null,
        source: "zoom" as const,
      }));

    // 4. Upsert en batch
    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("sessions")
        .upsert(rows, { onConflict: "zoom_meeting_id" });

      if (upsertError) {
        throw new Error(`upsert_failed: ${upsertError.message}`);
      }
    }

    // 5. Limpieza de canceladas: borra futuras source='zoom' que ya no vinieron en la sync
    const syncedIds = rows.map((r) => r.zoom_meeting_id);
    const nowIso = new Date().toISOString();

    let deleteQuery = supabase
      .from("sessions")
      .delete({ count: "exact" })
      .eq("source", "zoom")
      .gt("starts_at", nowIso);

    if (syncedIds.length > 0) {
      const idList = syncedIds.map((id) => `"${id}"`).join(",");
      deleteQuery = deleteQuery.not("zoom_meeting_id", "in", `(${idList})`);
    }

    const { count: deletedCount, error: deleteError } = await deleteQuery;

    if (deleteError) {
      throw new Error(`delete_failed: ${deleteError.message}`);
    }

    return jsonResponse({ synced: rows.length, deleted: deletedCount ?? 0 }, 200);
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
