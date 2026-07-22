# Sincronización Zoom → `sessions` (Edge Function `zoom-sync`)

Esta guía documenta la Edge Function `supabase/functions/zoom-sync/index.ts`,
que trae las reuniones "upcoming" de una cuenta de Zoom y las sincroniza a la
tabla `sessions` (creada por otra migración; esta función solo lee/escribe
contra su contrato: `id, title, description, starts_at, duration_min,
join_url, zoom_meeting_id, host, source, created_by, created_at, updated_at`).

## 1. Crear la app "Server-to-Server OAuth" en Zoom Marketplace

1. Entra a [marketplace.zoom.us](https://marketplace.zoom.us) con la cuenta
   de Zoom que administra las reuniones (necesitas rol de admin en esa cuenta
   de Zoom, no solo un usuario normal).
2. **Develop → Build App**.
3. Elige el tipo de app **Server-to-Server OAuth** (no OAuth normal, no JWT
   — ese tipo está deprecado).
4. Ponle un nombre (ej. `ailmx-cronograma-sync`) y crea la app.
5. En la pestaña **Scopes**, agrega el scope de solo lectura de reuniones:
   - `meeting:read:admin` (si quieres poder leer reuniones de **cualquier**
     usuario de la cuenta), o
   - `meeting:read` (si te alcanza con las reuniones del usuario dueño del
     token — la función usa el endpoint `/users/me/meetings`, que trae las
     reuniones del usuario asociado a las credenciales).
6. En la pestaña **App Credentials**, copia los tres valores que necesita la
   función:
   - **Account ID** → `ZOOM_ACCOUNT_ID`
   - **Client ID** → `ZOOM_CLIENT_ID`
   - **Client Secret** → `ZOOM_CLIENT_SECRET`
7. Activa la app (**Activate**). No requiere revisión de Zoom porque las apps
   Server-to-Server OAuth son de uso interno (no se publican en el
   Marketplace público).

## 2. Configurar los secrets en Supabase

La función lee `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID` y `ZOOM_CLIENT_SECRET` como
variables de entorno inyectadas por la plataforma (no van en el código ni en
`.env` del repo). `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya los inyecta
Supabase automáticamente en cada Edge Function, no hay que configurarlos.

**Opción A — Dashboard:**

1. Entra al proyecto en [supabase.com](https://supabase.com) →
   **Edge Functions** (menú lateral) → **Manage secrets**.
2. Agrega los tres secrets:
   - `ZOOM_ACCOUNT_ID`
   - `ZOOM_CLIENT_ID`
   - `ZOOM_CLIENT_SECRET`
3. Guarda. Los secrets quedan disponibles para todas las Edge Functions del
   proyecto (incluida `zoom-sync`) sin necesidad de redeploy.

**Opción B — CLI:**

```bash
supabase secrets set ZOOM_ACCOUNT_ID=xxxxxxxxxxxx
supabase secrets set ZOOM_CLIENT_ID=xxxxxxxxxxxx
supabase secrets set ZOOM_CLIENT_SECRET=xxxxxxxxxxxx
```

O en un solo comando:

```bash
supabase secrets set \
  ZOOM_ACCOUNT_ID=xxxxxxxxxxxx \
  ZOOM_CLIENT_ID=xxxxxxxxxxxx \
  ZOOM_CLIENT_SECRET=xxxxxxxxxxxx
```

## 3. Desplegar la función y el cron

Desplegar la función desde la raíz del repo:

```bash
supabase functions deploy zoom-sync
```

Un cron (definido en la migración `006_*` vía `pg_cron` / `pg_net`, fuera del
alcance de este documento) invoca el endpoint de la función cada 15 minutos
para mantener `sessions` sincronizada con Zoom sin intervención manual. Si
necesitas revisar o ajustar el cron, busca la migración `006` en
`supabase/migrations/`.

## 4. Probar manualmente con curl

```bash
curl -X POST https://hfffaxjfcpgvbtlgyfgn.supabase.co/functions/v1/zoom-sync \
  -H "Authorization: Bearer <ANON_KEY>"
```

Respuestas esperadas:

- **Sin los tres secrets de Zoom configurados** (estado normal antes del
  paso 2, o si algún secret falta):

  ```json
  { "skipped": true, "reason": "zoom_credentials_missing" }
  ```

  Esto es intencional: evita que el cron acumule errores mientras no hay
  credenciales de Zoom configuradas. Responde HTTP 200, no un error.

- **Con credenciales válidas y reuniones próximas sincronizadas:**

  ```json
  { "synced": 12, "deleted": 1 }
  ```

  `synced` es el número de reuniones "upcoming" traídas de Zoom en esa
  corrida (después de upsert por `zoom_meeting_id`); `deleted` es el número
  de sesiones `source = 'zoom'` con `starts_at` futuro que ya no aparecieron
  en Zoom (canceladas) y se borraron de `sessions`.

- **Si falla la autenticación OAuth con Zoom** (credenciales inválidas,
  scope insuficiente, etc.): HTTP 502 con `{ "error": "zoom_oauth_failed: ..." }`.

- **Error inesperado** (ej. falla de conexión a la base de datos): HTTP 500
  con `{ "error": "..." }`.

## 5. Nota de seguridad

- **Nunca** commitees `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID` ni
  `ZOOM_CLIENT_SECRET` al repo (ni en `.env`, ni en migraciones, ni en
  código). Viven únicamente como secrets de Supabase (Dashboard o
  `supabase secrets set`).
- La función usa el `SUPABASE_SERVICE_ROLE_KEY` inyectado automáticamente por
  la plataforma para escribir en `sessions` sin pasar por RLS — esa key
  nunca se expone al cliente ni se define manualmente; solo existe dentro
  del runtime de la Edge Function.
- El endpoint de la función (`/functions/v1/zoom-sync`) requiere el header
  `Authorization` (anon key o service role key) como cualquier Edge Function
  de Supabase; no expone las credenciales de Zoom en ninguna respuesta.
