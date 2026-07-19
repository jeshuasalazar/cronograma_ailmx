-- ============================================================================
-- 004_seed.sql
-- Datos REALES extraídos de const FRONTS / TEAM / SEED en
-- "Panel Operaciones aiLearning.html" (líneas ~320-346).
--
-- Los foreign keys se resuelven por nombre/título vía subconsultas (no se
-- hardcodean UUIDs), así que este script funciona sin importar el orden en
-- que Postgres genere los ids.
--
-- Criterios propios aplicados (ver también el reporte de migración):
--   1) "priority" no existe en el panel original. Se infiere de forma
--      heurística a partir del status: wait→high (la propia UI etiqueta
--      estos casos "En espera / Riesgo · Requieren atención"), done→low,
--      prog/todo→medium.
--   2) El owner TEAM.id="jhua" (mostrado como "JHUA" en el panel) se
--      mapea al team_member "Jeshua", conforme a instrucción explícita.
--   3) "created_by" no existe como concepto separado en el panel (solo hay
--      "owners"); se usa el primer responsable de cada actividad como autor.
--   4) Los valores literales "—" en materiales se conservan tal cual
--      (es lo que el panel realmente almacena y renderiza).
--   5) Las fechas "day"/"date" en texto (ej. "01 – 07 JUL 2026") se
--      convierten a start_date/due_date reales; el campo "time" (tiempo
--      estimado, texto libre) se conserva en estimated_time.
--   6) Los timestamps de notas y eventos replican los offsets relativos
--      daysAgo(n) del HTML original (calculados aquí como now() - n days).
-- ============================================================================

-- ── team_members ─────────────────────────────────────────────────────────
insert into team_members (name, role, color, is_admin) values
  ('Jeshua',     'Plataforma & banca',        '#F5B841', true),
  ('CP Roberto', 'Capacitación & contenido',  '#3DD68C', false),
  ('CP Blake',   'Dirección & alianzas',      '#4C9BF0', false);

-- ── fronts ───────────────────────────────────────────────────────────────
-- color tomado de las clases CSS .front.f0..f3 del panel original.
insert into fronts (name, tag, color, position) values
  ('Capacitaciones', 'Formación & temario',      '#7fc0ff', 0),
  ('Alianzas',        'Convenios & partners',     '#c3a6ff', 1),
  ('Banca',            'Cuentas & apertura',       '#7ee0b8', 2),
  ('Plataforma',        'Producto & lanzamiento',  '#ffc27a', 3);

-- ── activities (8 actividades reales del SEED) ──────────────────────────
insert into activities
  (title, description, front_id, status, priority, progress,
   start_date, due_date, estimated_time, materials, created_by)
values
  ('Conseguir dar capacitaciones',
   'Convencer a CP Herrera. Desarrollar temario y días de la capacitación.',
   (select id from fronts where name = 'Capacitaciones'),
   'done', 'low', 100,
   date '2026-07-01', date '2026-07-07',
   'Una semana', 'Desarrollo del temario y calendario.',
   (select id from team_members where name = 'CP Blake')),

  ('Recuperar la cuenta de BBVA',
   'Ir al banco y dar seguimiento al caso.',
   (select id from fronts where name = 'Banca'),
   'prog', 'medium', 50,
   date '2026-07-03', date '2026-07-13',
   'Una semana', '—',
   (select id from team_members where name = 'Jeshua')),

  ('Santander — opción de apertura',
   'Se revisaron los requisitos necesarios para la apertura.',
   (select id from fronts where name = 'Banca'),
   'wait', 'high', 30,
   date '2026-07-05', date '2026-07-20',
   '10 – 15 días', 'Inversión mínima $15,000 MXN por 3 meses.',
   (select id from team_members where name = 'CP Blake')),

  ('Página aiLearning para el evento LUMBRERA',
   'Estructurar la página lo más accesible posible y probarla con la capacitación de Lumbrera.',
   (select id from fronts where name = 'Plataforma'),
   'done', 'low', 90,
   date '2026-07-07', date '2026-07-15',
   'Avance o entrega final', '—',
   (select id from team_members where name = 'Jeshua')),

  ('AMCP — reunión con el presidente Daniel',
   'Enviar desde el correo de aiLearning: programa, temario, horas y documentos necesarios.',
   (select id from fronts where name = 'Alianzas'),
   'prog', 'medium', 45,
   date '2026-07-09', date '2026-07-10',
   '2 días', 'Desarrollo del temario y calendario.',
   (select id from team_members where name = 'CP Blake')),

  ('Reunión con CP Herrera',
   'Concretar alianza y habilitar el uso de la plataforma de aiLearning.',
   (select id from fronts where name = 'Alianzas'),
   'prog', 'medium', 60,
   date '2026-07-10', date '2026-07-10',
   '1 día', 'Página ya disponible.',
   (select id from team_members where name = 'CP Roberto')),

  ('SUSY de CONTPAQ — reintentar contacto',
   'Mantener contacto para explorar posibles alianzas. Insistir.',
   (select id from fronts where name = 'Alianzas'),
   'wait', 'high', 25,
   date '2026-07-12', date '2026-07-15',
   'Seguimiento', 'Se envió el resumen de la plática y/o curso.',
   (select id from team_members where name = 'CP Blake')),

  ('Retroalimentación de la grabación',
   'Observaciones, sugerencias y cambios sobre la reunión anterior.',
   (select id from fronts where name = 'Plataforma'),
   'todo', 'medium', 0,
   date '2026-07-12', date '2026-07-12',
   '1 día', 'Grabación de la reunión.',
   (select id from team_members where name = 'CP Roberto'));

-- ── activity_assignees (a.owners[] del SEED) ────────────────────────────
insert into activity_assignees (activity_id, team_member_id) values
  ((select id from activities where title = 'Conseguir dar capacitaciones'),           (select id from team_members where name = 'CP Blake')),
  ((select id from activities where title = 'Conseguir dar capacitaciones'),           (select id from team_members where name = 'CP Roberto')),
  ((select id from activities where title = 'Recuperar la cuenta de BBVA'),            (select id from team_members where name = 'Jeshua')),
  ((select id from activities where title = 'Santander — opción de apertura'),         (select id from team_members where name = 'CP Blake')),
  ((select id from activities where title = 'Página aiLearning para el evento LUMBRERA'), (select id from team_members where name = 'Jeshua')),
  ((select id from activities where title = 'AMCP — reunión con el presidente Daniel'), (select id from team_members where name = 'CP Blake')),
  ((select id from activities where title = 'AMCP — reunión con el presidente Daniel'), (select id from team_members where name = 'CP Roberto')),
  ((select id from activities where title = 'Reunión con CP Herrera'),                 (select id from team_members where name = 'CP Roberto')),
  ((select id from activities where title = 'SUSY de CONTPAQ — reintentar contacto'),  (select id from team_members where name = 'CP Blake')),
  ((select id from activities where title = 'Retroalimentación de la grabación'),      (select id from team_members where name = 'CP Roberto'));

-- ── activity_notes (a.notes[] del SEED; ts = daysAgo(n) → now() - n days) ─
insert into activity_notes (activity_id, author_id, body, created_at) values
  ((select id from activities where title = 'Conseguir dar capacitaciones'),
   (select id from team_members where name = 'CP Roberto'),
   'Ya se entregó temario, desarrollo y días.', now() - interval '9 days'),

  ((select id from activities where title = 'Recuperar la cuenta de BBVA'),
   (select id from team_members where name = 'Jeshua'),
   'Se acudió 2 veces; se mantiene contacto con BBVA.', now() - interval '4 days'),
  ((select id from activities where title = 'Recuperar la cuenta de BBVA'),
   (select id from team_members where name = 'Jeshua'),
   'Esperamos respuesta del banco.', now() - interval '1 day'),

  ((select id from activities where title = 'Santander — opción de apertura'),
   (select id from team_members where name = 'CP Blake'),
   'Se espera que la resolución de BBVA sea favorable antes de avanzar.', now() - interval '3 days'),

  ((select id from activities where title = 'Página aiLearning para el evento LUMBRERA'),
   (select id from team_members where name = 'Jeshua'),
   'Ya es posible entrar desde celular y computadora. Avance validado.', now() - interval '6 days'),

  ((select id from activities where title = 'Reunión con CP Herrera'),
   (select id from team_members where name = 'CP Roberto'),
   'Página lista para la demostración.', now() - interval '2 days'),

  ((select id from activities where title = 'SUSY de CONTPAQ — reintentar contacto'),
   (select id from team_members where name = 'CP Blake'),
   'Susy comenta que espera respuesta de sus desarrolladoras.', now() - interval '2 days');
-- 'AMCP — reunión con el presidente Daniel' y 'Retroalimentación de la grabación'
-- no tenían notas en el SEED original (notes:[]).

-- ── activity_events (equivalente a state.feed[], un evento por actividad) ─
insert into activity_events (activity_id, actor_id, kind, payload, created_at) values
  ((select id from activities where title = 'Conseguir dar capacitaciones'),
   (select id from team_members where name = 'CP Blake'),
   'status_changed', jsonb_build_object('status', 'done'), now() - interval '9 days'),

  ((select id from activities where title = 'Recuperar la cuenta de BBVA'),
   (select id from team_members where name = 'Jeshua'),
   'status_changed', jsonb_build_object('status', 'prog'), now() - interval '1 day'),

  ((select id from activities where title = 'Santander — opción de apertura'),
   (select id from team_members where name = 'CP Blake'),
   'status_changed', jsonb_build_object('status', 'wait'), now() - interval '3 days'),

  ((select id from activities where title = 'Página aiLearning para el evento LUMBRERA'),
   (select id from team_members where name = 'Jeshua'),
   'status_changed', jsonb_build_object('status', 'done'), now() - interval '6 days'),

  ((select id from activities where title = 'AMCP — reunión con el presidente Daniel'),
   (select id from team_members where name = 'CP Blake'),
   'created', jsonb_build_object('front', 'Alianzas'), now() - interval '5 days'),

  ((select id from activities where title = 'Reunión con CP Herrera'),
   (select id from team_members where name = 'CP Roberto'),
   'status_changed', jsonb_build_object('status', 'prog'), now() - interval '2 days'),

  ((select id from activities where title = 'SUSY de CONTPAQ — reintentar contacto'),
   (select id from team_members where name = 'CP Blake'),
   'status_changed', jsonb_build_object('status', 'wait'), now() - interval '2 days'),

  ((select id from activities where title = 'Retroalimentación de la grabación'),
   (select id from team_members where name = 'CP Roberto'),
   'created', jsonb_build_object('front', 'Plataforma'), now() - interval '7 days');
