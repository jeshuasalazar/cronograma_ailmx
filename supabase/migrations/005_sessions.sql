-- ============================================================================
-- 005_sessions.sql
-- Tabla de sesiones de Zoom y sesiones manuales de aprendizaje.
--
-- Almacena información de sesiones sincronizadas desde Zoom (via Edge Function
-- zoom-sync) o creadas manualmente en el panel. Cada sesión tiene título,
-- descripción, horario de inicio, duración, URL de unión, y metadatos de Zoom.
-- ============================================================================

-- ── sessions ──────────────────────────────────────────────────────────────
create table if not exists sessions (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  starts_at       timestamptz not null,
  duration_min    int,
  join_url        text,
  zoom_meeting_id text unique,
  host            text,
  source          text not null default 'manual'
                    check (source in ('zoom', 'manual')),
  created_by      uuid references team_members (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table sessions is
  'Sesiones de aprendizaje (Zoom o manuales). Sincronizadas desde Zoom cada 15 min; también editables manualmente en el panel.';
comment on column sessions.starts_at is
  'Hora de inicio de la sesión en UTC o zona local del evento.';
comment on column sessions.join_url is
  'URL de unión a la sesión (Zoom meeting URL o enlace manual).';
comment on column sessions.zoom_meeting_id is
  'ID único de reunión Zoom (ej. "123456789"). Null si es una sesión manual. Unique para evitar duplicados en sync.';
comment on column sessions.source is
  'Origen de la sesión: "zoom" (sincronizada desde Zoom) o "manual" (creada en el panel). Por defecto "manual".';

-- ── índices ────────────────────────────────────────────────────────────────
create index if not exists idx_sessions_starts_at on sessions (starts_at);

-- ── trigger: updated_at automático ─────────────────────────────────────────
drop trigger if exists trg_sessions_updated_at on sessions;
create trigger trg_sessions_updated_at
  before update on sessions
  for each row
  execute function set_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table sessions enable row level security;

-- ── sesiones: SELECT miembros; escritura/borrado solo admins ──────────────
drop policy if exists sessions_select on sessions;
create policy sessions_select on sessions
  for select
  using (is_member());

drop policy if exists sessions_insert on sessions;
create policy sessions_insert on sessions
  for insert
  with check (is_admin());

drop policy if exists sessions_update on sessions;
create policy sessions_update on sessions
  for update
  using (is_admin())
  with check (is_admin());

drop policy if exists sessions_delete on sessions;
create policy sessions_delete on sessions
  for delete
  using (is_admin());

-- ── Realtime ───────────────────────────────────────────────────────────────
alter publication supabase_realtime add table sessions;
