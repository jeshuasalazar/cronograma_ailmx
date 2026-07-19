-- ============================================================================
-- 003_rls.sql
-- Row Level Security + Realtime.
--
-- Modelo de acceso:
--   - Anónimos: sin acceso a nada (sin política = deny por defecto una vez
--     que RLS está activo; no se define ninguna política para el rol anon).
--   - Miembros autenticados (fila en team_members con auth_user_id = auth.uid()):
--       SELECT en TODAS las tablas.
--       INSERT/UPDATE en activities, activity_assignees, activity_notes,
--       activity_events.
--   - Solo admins (team_members.is_admin = true):
--       INSERT/UPDATE/DELETE en team_members y fronts.
--       DELETE en activities, activity_assignees, activity_notes, activity_events.
--
-- Las funciones is_member()/is_admin() son SECURITY DEFINER para poder leer
-- team_members sin caer en recursión de RLS (team_members también tiene RLS
-- activo). Deben crearse con un rol que tenga BYPASSRLS (el rol "postgres"
-- usado por el SQL Editor de Supabase lo tiene por defecto).
-- ============================================================================

-- ── helpers ──────────────────────────────────────────────────────────────
create or replace function is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from team_members tm
    where tm.auth_user_id = auth.uid()
  );
$$;
comment on function is_member() is
  'True si el usuario autenticado actual tiene una fila en team_members vinculada por auth_user_id.';

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from team_members tm
    where tm.auth_user_id = auth.uid()
      and tm.is_admin = true
  );
$$;
comment on function is_admin() is
  'True si el usuario autenticado actual es un team_member con is_admin = true.';

revoke all on function is_member() from public;
revoke all on function is_admin() from public;
grant execute on function is_member() to authenticated, anon;
grant execute on function is_admin() to authenticated, anon;

-- ── activar RLS en todas las tablas ─────────────────────────────────────
alter table team_members       enable row level security;
alter table fronts             enable row level security;
alter table activities         enable row level security;
alter table activity_assignees enable row level security;
alter table activity_notes     enable row level security;
alter table activity_events    enable row level security;

-- ── team_members: SELECT miembros; escritura solo admins ───────────────
drop policy if exists team_members_select on team_members;
create policy team_members_select on team_members
  for select
  using (is_member());

drop policy if exists team_members_insert on team_members;
create policy team_members_insert on team_members
  for insert
  with check (is_admin());

drop policy if exists team_members_update on team_members;
create policy team_members_update on team_members
  for update
  using (is_admin())
  with check (is_admin());

drop policy if exists team_members_delete on team_members;
create policy team_members_delete on team_members
  for delete
  using (is_admin());

-- ── fronts: SELECT miembros; escritura solo admins ──────────────────────
drop policy if exists fronts_select on fronts;
create policy fronts_select on fronts
  for select
  using (is_member());

drop policy if exists fronts_insert on fronts;
create policy fronts_insert on fronts
  for insert
  with check (is_admin());

drop policy if exists fronts_update on fronts;
create policy fronts_update on fronts
  for update
  using (is_admin())
  with check (is_admin());

drop policy if exists fronts_delete on fronts;
create policy fronts_delete on fronts
  for delete
  using (is_admin());

-- ── activities: SELECT/INSERT/UPDATE miembros; DELETE solo admins ──────
drop policy if exists activities_select on activities;
create policy activities_select on activities
  for select
  using (is_member());

drop policy if exists activities_insert on activities;
create policy activities_insert on activities
  for insert
  with check (is_member());

drop policy if exists activities_update on activities;
create policy activities_update on activities
  for update
  using (is_member())
  with check (is_member());

drop policy if exists activities_delete on activities;
create policy activities_delete on activities
  for delete
  using (is_admin());

-- ── activity_assignees: SELECT/INSERT/UPDATE miembros; DELETE solo admins ─
drop policy if exists activity_assignees_select on activity_assignees;
create policy activity_assignees_select on activity_assignees
  for select
  using (is_member());

drop policy if exists activity_assignees_insert on activity_assignees;
create policy activity_assignees_insert on activity_assignees
  for insert
  with check (is_member());

drop policy if exists activity_assignees_update on activity_assignees;
create policy activity_assignees_update on activity_assignees
  for update
  using (is_member())
  with check (is_member());

drop policy if exists activity_assignees_delete on activity_assignees;
create policy activity_assignees_delete on activity_assignees
  for delete
  using (is_admin());

-- ── activity_notes: SELECT/INSERT/UPDATE miembros; DELETE solo admins ──
drop policy if exists activity_notes_select on activity_notes;
create policy activity_notes_select on activity_notes
  for select
  using (is_member());

drop policy if exists activity_notes_insert on activity_notes;
create policy activity_notes_insert on activity_notes
  for insert
  with check (is_member());

drop policy if exists activity_notes_update on activity_notes;
create policy activity_notes_update on activity_notes
  for update
  using (is_member())
  with check (is_member());

drop policy if exists activity_notes_delete on activity_notes;
create policy activity_notes_delete on activity_notes
  for delete
  using (is_admin());

-- ── activity_events: SELECT/INSERT/UPDATE miembros; DELETE solo admins ──
drop policy if exists activity_events_select on activity_events;
create policy activity_events_select on activity_events
  for select
  using (is_member());

drop policy if exists activity_events_insert on activity_events;
create policy activity_events_insert on activity_events
  for insert
  with check (is_member());

drop policy if exists activity_events_update on activity_events;
create policy activity_events_update on activity_events
  for update
  using (is_member())
  with check (is_member());

drop policy if exists activity_events_delete on activity_events;
create policy activity_events_delete on activity_events
  for delete
  using (is_admin());

-- ── Realtime ─────────────────────────────────────────────────────────────
alter publication supabase_realtime
  add table activities, activity_assignees, activity_notes, activity_events;
