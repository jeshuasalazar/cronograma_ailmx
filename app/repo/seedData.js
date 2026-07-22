// Seed data for demo / local-first mode.
//
// IMPORTANT: this mirrors `supabase/migrations/004_seed.sql` field-for-field
// (same table/column names, same real data, same priority heuristic), NOT
// the legacy panel's raw in-browser SEED array. The Supabase schema
// (`supabase/migrations/001_schema.sql`, see also `docs/SUPABASE_SETUP.md`)
// is the source of truth for shape; this file is its localStorage-mode
// equivalent so localRepo.js and supabaseRepo.js can share one interface.
//
// Traceability back to the original "Panel Operaciones aiLearning.html"
// (FRONTS/TEAM/SEED consts, ~line 320-346):
//   - front.tag / front.color come from the .front.f0..f3 CSS classes.
//   - member "jhua" (shown "JHUA") is the real person Jeshua -> id "jeshua".
//   - activities.description = legacy `task`, .materials = legacy `mat`,
//     .estimatedTime = legacy `time`, .progress = legacy `prog`.
//   - priority is a NEW field (the legacy panel had none): inferred as
//     wait->high, done->low, prog/todo->medium (same heuristic as the SQL seed).
//   - legacy `day` (day-of-month int) + `date` (free-text range) are
//     replaced by real `startDate`/`dueDate` (ISO dates) — the UI can
//     derive a day badge from `dueDate`/`startDate` itself.
//   - activity_events is per-activity (kind + payload), not a global feed
//     table — `listEvents()` in the repo layer joins across activities to
//     reproduce the legacy panel's global "Actividad reciente" feed.

function daysAgo(d) {
  return new Date(Date.now() - d * 86400000).toISOString();
}

function daysFromNow(d) {
  return new Date(Date.now() + d * 86400000).toISOString();
}

/** @typedef {'todo'|'prog'|'wait'|'done'} ActivityStatus */
/** @typedef {'low'|'medium'|'high'|'urgent'} ActivityPriority */

export const STATUS = {
  done: { label: "Completado", color: "#3DD68C" },
  prog: { label: "En proceso", color: "#4C9BF0" },
  wait: { label: "En espera", color: "#FF7A5C" },
  todo: { label: "Pendiente", color: "#6C7B92" },
};

export const PRIORITY = {
  low: { label: "Baja", color: "#6C7B92" },
  medium: { label: "Media", color: "#F5B841" },
  high: { label: "Alta", color: "#FF7A5C" },
  urgent: { label: "Urgente", color: "#E5484D" },
};

/** @type {Array<{id: string, name: string, tag: string, color: string, position: number}>} */
export const seedFronts = [
  { id: "front-capacitaciones", name: "Capacitaciones", tag: "Formación & temario", color: "#7fc0ff", position: 0 },
  { id: "front-alianzas", name: "Alianzas", tag: "Convenios & partners", color: "#c3a6ff", position: 1 },
  { id: "front-banca", name: "Banca", tag: "Cuentas & apertura", color: "#7ee0b8", position: 2 },
  { id: "front-plataforma", name: "Plataforma", tag: "Producto & lanzamiento", color: "#ffc27a", position: 3 },
];

/** @type {Array<{id: string, name: string, role: string, color: string, email: string|null, authUserId: string|null, isAdmin: boolean}>} */
export const seedMembers = [
  { id: "jeshua", name: "Jeshua", role: "Plataforma & banca", color: "#F5B841", email: null, authUserId: null, isAdmin: true },
  { id: "cp-roberto", name: "CP Roberto", role: "Capacitación & contenido", color: "#3DD68C", email: null, authUserId: null, isAdmin: false },
  { id: "cp-blake", name: "CP Blake", role: "Dirección & alianzas", color: "#4C9BF0", email: null, authUserId: null, isAdmin: false },
];

/**
 * @type {Array<{
 *   id: string, title: string, description: string, front: string,
 *   assignees: string[], status: ActivityStatus, priority: ActivityPriority,
 *   progress: number, startDate: string, dueDate: string,
 *   estimatedTime: string, materials: string, createdBy: string,
 *   notes: Array<{id: string, body: string, authorId: string, createdAt: string}>,
 *   createdAt: string, updatedAt: string
 * }>}
 */
export const seedActivities = [
  {
    id: "a1",
    title: "Conseguir dar capacitaciones",
    description: "Convencer a CP Herrera. Desarrollar temario y días de la capacitación.",
    front: "front-capacitaciones",
    assignees: ["cp-blake", "cp-roberto"],
    status: "done",
    priority: "low",
    progress: 100,
    startDate: "2026-07-01",
    dueDate: "2026-07-07",
    estimatedTime: "Una semana",
    materials: "Desarrollo del temario y calendario.",
    createdBy: "cp-blake",
    notes: [{ id: "a1-n1", body: "Ya se entregó temario, desarrollo y días.", authorId: "cp-roberto", createdAt: daysAgo(9) }],
  },
  {
    id: "a2",
    title: "Recuperar la cuenta de BBVA",
    description: "Ir al banco y dar seguimiento al caso.",
    front: "front-banca",
    assignees: ["jeshua"],
    status: "prog",
    priority: "medium",
    progress: 50,
    startDate: "2026-07-03",
    dueDate: "2026-07-13",
    estimatedTime: "Una semana",
    materials: "—",
    createdBy: "jeshua",
    notes: [
      { id: "a2-n1", body: "Se acudió 2 veces; se mantiene contacto con BBVA.", authorId: "jeshua", createdAt: daysAgo(4) },
      { id: "a2-n2", body: "Esperamos respuesta del banco.", authorId: "jeshua", createdAt: daysAgo(1) },
    ],
  },
  {
    id: "a3",
    title: "Santander — opción de apertura",
    description: "Se revisaron los requisitos necesarios para la apertura.",
    front: "front-banca",
    assignees: ["cp-blake"],
    status: "wait",
    priority: "high",
    progress: 30,
    startDate: "2026-07-05",
    dueDate: "2026-07-20",
    estimatedTime: "10 – 15 días",
    materials: "Inversión mínima $15,000 MXN por 3 meses.",
    createdBy: "cp-blake",
    notes: [
      { id: "a3-n1", body: "Se espera que la resolución de BBVA sea favorable antes de avanzar.", authorId: "cp-blake", createdAt: daysAgo(3) },
    ],
  },
  {
    id: "a4",
    title: "Página aiLearning para el evento LUMBRERA",
    description: "Estructurar la página lo más accesible posible y probarla con la capacitación de Lumbrera.",
    front: "front-plataforma",
    assignees: ["jeshua"],
    status: "done",
    priority: "low",
    progress: 90,
    startDate: "2026-07-07",
    dueDate: "2026-07-15",
    estimatedTime: "Avance o entrega final",
    materials: "—",
    createdBy: "jeshua",
    notes: [
      { id: "a4-n1", body: "Ya es posible entrar desde celular y computadora. Avance validado.", authorId: "jeshua", createdAt: daysAgo(6) },
    ],
  },
  {
    id: "a5",
    title: "AMCP — reunión con el presidente Daniel",
    description: "Enviar desde el correo de aiLearning: programa, temario, horas y documentos necesarios.",
    front: "front-alianzas",
    assignees: ["cp-blake", "cp-roberto"],
    status: "prog",
    priority: "medium",
    progress: 45,
    startDate: "2026-07-09",
    dueDate: "2026-07-10",
    estimatedTime: "2 días",
    materials: "Desarrollo del temario y calendario.",
    createdBy: "cp-blake",
    notes: [],
  },
  {
    id: "a6",
    title: "Reunión con CP Herrera",
    description: "Concretar alianza y habilitar el uso de la plataforma de aiLearning.",
    front: "front-alianzas",
    assignees: ["cp-roberto"],
    status: "prog",
    priority: "medium",
    progress: 60,
    startDate: "2026-07-10",
    dueDate: "2026-07-10",
    estimatedTime: "1 día",
    materials: "Página ya disponible.",
    createdBy: "cp-roberto",
    notes: [{ id: "a6-n1", body: "Página lista para la demostración.", authorId: "cp-roberto", createdAt: daysAgo(2) }],
  },
  {
    id: "a7",
    title: "SUSY de CONTPAQ — reintentar contacto",
    description: "Mantener contacto para explorar posibles alianzas. Insistir.",
    front: "front-alianzas",
    assignees: ["cp-blake"],
    status: "wait",
    priority: "high",
    progress: 25,
    startDate: "2026-07-12",
    dueDate: "2026-07-15",
    estimatedTime: "Seguimiento",
    materials: "Se envió el resumen de la plática y/o curso.",
    createdBy: "cp-blake",
    notes: [
      { id: "a7-n1", body: "Susy comenta que espera respuesta de sus desarrolladoras.", authorId: "cp-blake", createdAt: daysAgo(2) },
    ],
  },
  {
    id: "a8",
    title: "Retroalimentación de la grabación",
    description: "Observaciones, sugerencias y cambios sobre la reunión anterior.",
    front: "front-plataforma",
    assignees: ["cp-roberto"],
    status: "todo",
    priority: "medium",
    progress: 0,
    startDate: "2026-07-12",
    dueDate: "2026-07-12",
    estimatedTime: "1 día",
    materials: "Grabación de la reunión.",
    createdBy: "cp-roberto",
    notes: [],
  },
].map((a) => ({ ...a, createdAt: daysAgo(9), updatedAt: daysAgo(0) }));

/**
 * activity_events seed — one per activity, matching 004_seed.sql exactly.
 * @type {Array<{id: string, activityId: string, actorId: string, kind: string, payload: object, createdAt: string}>}
 */
export const seedEvents = [
  { id: "a1-e1", activityId: "a1", actorId: "cp-blake", kind: "status_changed", payload: { status: "done" }, createdAt: daysAgo(9) },
  { id: "a2-e1", activityId: "a2", actorId: "jeshua", kind: "status_changed", payload: { status: "prog" }, createdAt: daysAgo(1) },
  { id: "a3-e1", activityId: "a3", actorId: "cp-blake", kind: "status_changed", payload: { status: "wait" }, createdAt: daysAgo(3) },
  { id: "a4-e1", activityId: "a4", actorId: "jeshua", kind: "status_changed", payload: { status: "done" }, createdAt: daysAgo(6) },
  { id: "a5-e1", activityId: "a5", actorId: "cp-blake", kind: "created", payload: { front: "Alianzas" }, createdAt: daysAgo(5) },
  { id: "a6-e1", activityId: "a6", actorId: "cp-roberto", kind: "status_changed", payload: { status: "prog" }, createdAt: daysAgo(2) },
  { id: "a7-e1", activityId: "a7", actorId: "cp-blake", kind: "status_changed", payload: { status: "wait" }, createdAt: daysAgo(2) },
  { id: "a8-e1", activityId: "a8", actorId: "cp-roberto", kind: "created", payload: { front: "Plataforma" }, createdAt: daysAgo(7) },
];

/**
 * sessions seed — upcoming Zoom/manual sessions.
 * @type {Array<{
 *   id: string, title: string, description: string, startsAt: string,
 *   durationMin: number, joinUrl: string, zoomMeetingId: string|null,
 *   host: string, source: 'zoom'|'manual', createdBy: string|null,
 *   createdAt: string, updatedAt: string
 * }>}
 */
export const seedSessions = [
  {
    id: "sess-seed-1",
    title: "Capacitación: fundamentos de IA aplicada",
    description: "Sesión introductoria del temario de capacitaciones.",
    startsAt: daysFromNow(1),
    durationMin: 60,
    joinUrl: "https://us02web.zoom.us/j/123456789",
    zoomMeetingId: "123456789",
    host: "cp-roberto",
    source: "zoom",
    createdBy: "cp-roberto",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "sess-seed-2",
    title: "Reunión de seguimiento con AMCP",
    description: "Revisión de programa, temario y documentos pendientes.",
    startsAt: daysFromNow(3),
    durationMin: 90,
    joinUrl: "https://us02web.zoom.us/j/123456790",
    zoomMeetingId: null,
    host: "cp-blake",
    source: "manual",
    createdBy: "cp-blake",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "sess-seed-3",
    title: "Demo de plataforma para CP Herrera",
    description: "Demostración de la plataforma aiLearning y alianza.",
    startsAt: daysFromNow(7),
    durationMin: 60,
    joinUrl: "https://us02web.zoom.us/j/123456791",
    zoomMeetingId: null,
    host: "jeshua",
    source: "manual",
    createdBy: "jeshua",
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
];
