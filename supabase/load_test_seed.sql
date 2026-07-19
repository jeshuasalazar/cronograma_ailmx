-- ============================================================================
-- load_test_seed.sql
-- Datos SINTÉTICOS de carga para probar índices, RLS y planes de consulta
-- bajo volumen realista. Ejecutar UNA SOLA VEZ en el SQL Editor de Supabase
-- (o vía psql), DESPUÉS de correr 001_schema.sql → 004_seed.sql.
--
-- Genera:
--   - 20 team_members extra   (prefijo "LT Member")
--   -  8 fronts extra          (prefijo "LT Frente")
--   - ~3,000 activities        (prefijo "LT-", repartidas entre TODOS los
--                                frentes/miembros, reales + sintéticos)
--   - ~4,000 activity_assignees (1-2 responsables por actividad sintética)
--   - ~12,000 activity_notes
--   - ~12,000 activity_events
--
-- No es idempotente: si se vuelve a correr, duplica los datos sintéticos.
-- Todo lo sintético lleva el prefijo "LT" en title/name para poder limpiarlo
-- a mano con, por ejemplo:
--   delete from activities where title like 'LT-%';
--   delete from fronts where name like 'LT Frente%';
--   delete from team_members where name like 'LT Member%';
-- (los deletes en cascada limpian activity_assignees/notes/events asociados)
-- ============================================================================

-- ── 1) 20 miembros extra ────────────────────────────────────────────────
insert into team_members (name, role, color, is_admin)
select
  'LT Member ' || g,
  (array['Ventas', 'Soporte', 'Contenido', 'Operaciones', 'Producto'])[1 + (g % 5)],
  '#' || lpad(to_hex(((g * 9973) % 16777215)::int), 6, '0'),
  false
from generate_series(1, 20) as g;

-- ── 2) 8 frentes extra ──────────────────────────────────────────────────
insert into fronts (name, tag, color, position)
select
  'LT Frente ' || g,
  'Frente sintético de prueba #' || g,
  '#' || lpad(to_hex(((g * 7919) % 16777215)::int), 6, '0'),
  100 + g
from generate_series(1, 8) as g;

-- ── 3) ~3,000 actividades sintéticas ────────────────────────────────────
do $$
declare
  front_ids  uuid[];
  member_ids uuid[];
begin
  select array_agg(id order by position, name) into front_ids  from fronts;
  select array_agg(id order by created_at, name) into member_ids from team_members;

  insert into activities
    (title, description, front_id, status, priority, progress,
     start_date, due_date, estimated_time, materials, created_by)
  select
    'LT-' || g || ' Actividad sintética ' || g,
    'Descripción generada automáticamente para la actividad de carga #' || g ||
      '. Texto libre para probar búsqueda trigram y filtros combinados de estado/prioridad.',
    front_ids[1 + (g % array_length(front_ids, 1))],
    (array['todo', 'prog', 'wait', 'done'])[1 + (g % 4)],
    (array['low', 'medium', 'high', 'urgent'])[1 + (g % 4)],
    (g * 37) % 101,
    date '2026-01-01' + ((g % 365) || ' days')::interval,
    date '2026-01-01' + (((g % 365) + 1 + (g % 20)) || ' days')::interval,
    (array['1 día', '3 días', 'Una semana', '2 semanas', 'Un mes'])[1 + (g % 5)],
    case when g % 4 = 0 then '—' else 'Material sintético #' || g end,
    member_ids[1 + (g % array_length(member_ids, 1))]
  from generate_series(1, 3000) as g;
end $$;

-- ── 4) responsables de las actividades sintéticas (~4,000 filas) ───────
do $$
declare
  activity_ids uuid[];
  member_ids   uuid[];
  n_activities int;
  n_members    int;
begin
  select array_agg(id order by created_at) into activity_ids
    from activities where title like 'LT-%';
  select array_agg(id order by created_at, name) into member_ids from team_members;
  n_activities := array_length(activity_ids, 1);
  n_members    := array_length(member_ids, 1);

  -- 1 responsable principal por actividad sintética
  insert into activity_assignees (activity_id, team_member_id)
  select
    activity_ids[i],
    member_ids[1 + ((i * 7) % n_members)]
  from generate_series(1, n_activities) as i
  on conflict do nothing;

  -- ~1/3 de las actividades reciben un segundo responsable
  insert into activity_assignees (activity_id, team_member_id)
  select
    activity_ids[i],
    member_ids[1 + ((i * 11 + 3) % n_members)]
  from generate_series(1, n_activities) as i
  where i % 3 = 0
  on conflict do nothing;
end $$;

-- ── 5) ~12,000 notas sintéticas ─────────────────────────────────────────
do $$
declare
  activity_ids uuid[];
  member_ids   uuid[];
  n_activities int;
  n_members    int;
begin
  select array_agg(id order by created_at) into activity_ids from activities;
  select array_agg(id order by created_at, name) into member_ids from team_members;
  n_activities := array_length(activity_ids, 1);
  n_members    := array_length(member_ids, 1);

  insert into activity_notes (activity_id, author_id, body, created_at)
  select
    activity_ids[1 + (g % n_activities)],
    member_ids[1 + ((g * 13) % n_members)],
    'Nota sintética de seguimiento #' || g || ': avance registrado durante la prueba de carga.',
    now() - ((g % 400) || ' days')::interval - ((g % 24) || ' hours')::interval
  from generate_series(1, 12000) as g;
end $$;

-- ── 6) ~12,000 eventos sintéticos ───────────────────────────────────────
do $$
declare
  activity_ids uuid[];
  member_ids   uuid[];
  n_activities int;
  n_members    int;
  kinds        text[] := array['created', 'status_changed', 'progress_changed',
                                'note_added', 'updated', 'assignee_added'];
begin
  select array_agg(id order by created_at) into activity_ids from activities;
  select array_agg(id order by created_at, name) into member_ids from team_members;
  n_activities := array_length(activity_ids, 1);
  n_members    := array_length(member_ids, 1);

  insert into activity_events (activity_id, actor_id, kind, payload, created_at)
  select
    activity_ids[1 + (g % n_activities)],
    member_ids[1 + ((g * 17) % n_members)],
    kinds[1 + (g % array_length(kinds, 1))],
    jsonb_build_object('seq', g, 'source', 'load_test'),
    now() - ((g % 400) || ' days')::interval - ((g % 24) || ' hours')::interval
  from generate_series(1, 12000) as g;
end $$;

-- ── recuento final (opcional, informativo) ──────────────────────────────
select
  (select count(*) from team_members)       as team_members,
  (select count(*) from fronts)              as fronts,
  (select count(*) from activities)          as activities,
  (select count(*) from activity_assignees)  as activity_assignees,
  (select count(*) from activity_notes)      as activity_notes,
  (select count(*) from activity_events)     as activity_events;

-- ============================================================================
-- QUERIES REPRESENTATIVAS — correr manualmente con EXPLAIN ANALYZE una vez
-- cargados los datos de arriba, para revisar que los índices de
-- 002_indexes.sql se estén usando (Bitmap/Index Scan en vez de Seq Scan).
-- ============================================================================

-- 1) Lista filtrada del tablero: por estado + prioridad, ordenada por fecha
--    límite, con paginación (equivalente al filtro de chips del panel).
-- explain analyze
-- select a.id, a.title, a.status, a.priority, a.progress, a.due_date, f.name as front_name
-- from activities a
-- join fronts f on f.id = a.front_id
-- where a.status = 'prog' and a.priority in ('high', 'urgent')
-- order by a.due_date asc nulls last
-- limit 50;

-- 2) Búsqueda de texto libre (título + descripción) usando el índice GIN trgm.
-- explain analyze
-- select id, title
-- from activities
-- where (title || ' ' || coalesce(description, '')) ilike '%sintética 1500%';

-- 3) Detalle de una actividad con notas paginadas (más recientes primero).
-- explain analyze
-- select id, body, created_at
-- from activity_notes
-- where activity_id = (select id from activities order by created_at limit 1)
-- order by created_at desc
-- limit 20 offset 0;

-- 4) KPIs globales (avance por estado, equivalente a la franja KPI del panel).
-- explain analyze
-- select status, count(*) as total, round(avg(progress)) as avg_progress
-- from activities
-- group by status;

-- 5) Carga activa por responsable (equivalente al panel "Equipo" → "activas").
-- explain analyze
-- select tm.name, count(*) filter (where a.status <> 'done') as activas
-- from activity_assignees aa
-- join activities a on a.id = aa.activity_id
-- join team_members tm on tm.id = aa.team_member_id
-- group by tm.name
-- order by activas desc
-- limit 10;
