-- ============================================================================
-- 002_indexes.sql
-- Índices para los patrones de consulta esperados del panel: tablero
-- filtrado por estado/prioridad/frente/fecha, listados por responsable,
-- notas y eventos paginados por actividad, y búsqueda de texto libre.
-- ============================================================================

-- ── activities ───────────────────────────────────────────────────────────
create index if not exists idx_activities_status    on activities (status);
create index if not exists idx_activities_priority  on activities (priority);
create index if not exists idx_activities_front_id  on activities (front_id);
create index if not exists idx_activities_due_date  on activities (due_date);

-- ── activity_assignees ──────────────────────────────────────────────────
create index if not exists idx_activity_assignees_activity_id
  on activity_assignees (activity_id);
create index if not exists idx_activity_assignees_team_member_id
  on activity_assignees (team_member_id);

-- ── activity_notes: paginación "notas más recientes primero" por actividad ─
create index if not exists idx_activity_notes_activity_created
  on activity_notes (activity_id, created_at desc);

-- ── activity_events: feed "más reciente primero" por actividad ─────────────
create index if not exists idx_activity_events_activity_created
  on activity_events (activity_id, created_at desc);

-- ── búsqueda de texto libre (título + descripción) ──────────────────────
create extension if not exists pg_trgm;

create index if not exists idx_activities_search_trgm
  on activities
  using gin ((title || ' ' || coalesce(description, '')) gin_trgm_ops);
