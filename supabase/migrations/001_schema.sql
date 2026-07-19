-- ============================================================================
-- 001_schema.sql
-- Esquema base del Panel de Operaciones aiLearning (migración desde el
-- prototipo localStorage en "Panel Operaciones aiLearning.html").
--
-- Extraído del JS embebido del panel (const FRONTS, TEAM, STATUS, SEED,
-- cerca de la línea 320-346 del HTML):
--   - FRONTS: Capacitaciones, Alianzas, Banca, Plataforma
--   - TEAM:   blake (CP Blake), roberto (CP Roberto), jhua (JHUA / Jeshua)
--   - STATUS: todo (Pendiente), prog (En proceso), wait (En espera/Riesgo),
--             done (Completado)  ← usados literalmente como a.status
--
-- NOTA IMPORTANTE: el panel HTML original NO maneja un campo "priority".
-- Se añade aquí como campo nuevo requerido por el rediseño (ver
-- docs/SUPABASE_SETUP.md y el reporte de migración para el detalle de cómo
-- se asignaron valores de prioridad a los datos semilla reales).
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid() (ya viene activa en Supabase, se declara por seguridad)

-- ── team_members ─────────────────────────────────────────────────────────
create table if not exists team_members (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text unique,
  auth_user_id  uuid unique references auth.users (id) on delete set null,
  is_admin      boolean not null default false,
  role          text,
  color         text,
  created_at    timestamptz not null default now()
);
comment on table team_members is
  'Miembros del equipo de operaciones. auth_user_id se vincula tras invitar por email en Supabase Auth (Dashboard → Auth → Invite user).';
comment on column team_members.role is
  'Rol libre mostrado en el panel (ej. "Dirección & alianzas"). No se usa para permisos, solo UI.';
comment on column team_members.color is
  'Color hex del avatar en el panel (ej. "#4C9BF0"). Columna añadida para no perder datos del HTML original.';

-- ── fronts ───────────────────────────────────────────────────────────────
create table if not exists fronts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  tag         text,
  color       text,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
comment on column fronts.tag is
  'Subtítulo descriptivo del frente (ej. "Formación & temario"), tal como aparece en el panel.';
comment on column fronts.position is
  'Orden de despliegue en el panel. Equivale al id numérico 0-3 usado en el arreglo FRONTS del HTML original.';

-- ── activities ───────────────────────────────────────────────────────────
create table if not exists activities (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  front_id        uuid references fronts (id) on delete set null,
  status          text not null default 'todo'
                    check (status in ('todo', 'prog', 'wait', 'done')),
  priority        text not null default 'medium'
                    check (priority in ('low', 'medium', 'high', 'urgent')),
  progress        int not null default 0
                    check (progress between 0 and 100),
  start_date      date,
  due_date        date,
  estimated_time  text,
  materials       text,
  created_by      uuid references team_members (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint activities_date_order
    check (start_date is null or due_date is null or start_date <= due_date)
);
comment on column activities.status is
  'Valores EXACTOS usados por el panel HTML (const STATUS): todo=Pendiente, prog=En proceso, wait=En espera/Riesgo, done=Completado.';
comment on column activities.priority is
  'Campo nuevo: el HTML original no maneja prioridad. Ver docs/SUPABASE_SETUP.md para el criterio usado al poblar el seed real.';
comment on column activities.description is
  'Mapea el campo "task" (Tareas principales) del panel original.';
comment on column activities.materials is
  'Mapea el campo "mat" (Materiales necesarios) del panel original, incluyendo el valor literal "—" cuando no aplica.';
comment on column activities.estimated_time is
  'Mapea el campo "time" (Tiempo estimado, ej. "Una semana"). Columna añadida para no perder datos del HTML original.';

-- ── activity_assignees (N:M actividades ↔ responsables) ────────────────────
create table if not exists activity_assignees (
  activity_id     uuid not null references activities (id) on delete cascade,
  team_member_id  uuid not null references team_members (id) on delete cascade,
  assigned_at     timestamptz not null default now(),
  primary key (activity_id, team_member_id)
);
comment on table activity_assignees is
  'Mapea el arreglo a.owners[] del panel original (una actividad puede tener varios responsables).';

-- ── activity_notes ───────────────────────────────────────────────────────
create table if not exists activity_notes (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references activities (id) on delete cascade,
  author_id    uuid references team_members (id) on delete set null,
  body         text not null,
  created_at   timestamptz not null default now()
);
comment on table activity_notes is
  'Mapea el arreglo a.notes[] ({t, by, ts}) del panel original.';

-- ── activity_events (feed "Actividad reciente") ─────────────────────────
create table if not exists activity_events (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references activities (id) on delete cascade,
  actor_id     uuid references team_members (id) on delete set null,
  kind         text not null,
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
comment on table activity_events is
  'Mapea state.feed[] del panel original (logEvent). kind es texto libre: created, status_changed, progress_changed, note_added, updated, deleted, assignee_added, etc.';

-- ── trigger: updated_at automático en activities ────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_activities_updated_at on activities;
create trigger trg_activities_updated_at
  before update on activities
  for each row
  execute function set_updated_at();
