// supabase/functions/zoom-webhook/index.ts
//
// Receptor de webhooks de Zoom. Cuando Zoom notifica un cambio en una reunión
// (meeting.created / meeting.updated / meeting.deleted / etc.) dispara un
// re-sync invocando la función `zoom-sync`, de modo que la tabla `sessions`
// se actualiza al instante (además del cron cada 15 min y del sync al abrir
// la página).
//
// Esta función NO usa verify_jwt (Zoom no envía un JWT de Supabase): valida en
// su lugar la firma HMAC de Zoom con el "Secret Token" (env ZOOM_SECRET_TOKEN)
// y responde el handshake `endpoint.url_validation`.
//
// Configuración en Zoom (Marketplace → tu app Server-to-Server OAuth →
// Feature → Event Subscriptions): endpoint URL =
//   https://<REF>.supabase.co/functions/v1/zoom-webhook
// eventos: Meeting > Created/Updated/Deleted/Started/Ended.

// deno-lint-ignore-file no-explicit-any

const SECRET = Deno.env.get("ZOOM_SECRET_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function hmacHex(key: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const raw = await req.text();
  let body: any = {};
  try { body = JSON.parse(raw); } catch { /* keep {} */ }

  // 1. Handshake de validación de URL de Zoom.
  if (body?.event === "endpoint.url_validation") {
    const plainToken = body?.payload?.plainToken ?? "";
    if (!SECRET) return json({ error: "missing_secret" }, 500);
    const encryptedToken = await hmacHex(SECRET, plainToken);
    return json({ plainToken, encryptedToken });
  }

  // 2. Verificación de firma (si hay Secret Token configurado).
  if (SECRET) {
    const ts = req.headers.get("x-zm-request-timestamp") ?? "";
    const sig = req.headers.get("x-zm-signature") ?? "";
    const expected = "v0=" + (await hmacHex(SECRET, `v0:${ts}:${raw}`));
    if (sig !== expected) return json({ error: "invalid_signature" }, 401);
  }

  // 3. Ante un cambio de reunión, dispara un re-sync (fire-and-forget).
  const event: string = typeof body?.event === "string" ? body.event : "";
  if (event.startsWith("meeting.") && SUPABASE_URL && SERVICE_ROLE) {
    // No await: respondemos rápido a Zoom; el sync corre en segundo plano.
    fetch(`${SUPABASE_URL}/functions/v1/zoom-sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => { /* el cron/pageload lo recogen si esto falla */ });
  }

  return json({ ok: true, event });
});
