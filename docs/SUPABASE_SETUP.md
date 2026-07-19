# Configuración de Supabase — Panel de Operaciones aiLearning

Esta guía cubre solo la parte de Supabase (base de datos, auth, realtime) de
la migración desde el panel HTML + localStorage a Vite + Supabase. No cubre
cambios en el frontend.

## 1. Crear el proyecto en supabase.com

1. Entra a [supabase.com](https://supabase.com) e inicia sesión (o crea una cuenta).
2. **New project** → elige la organización, un nombre (ej. `ailmx-panel-operaciones`),
   una contraseña de base de datos (guárdala en un gestor de contraseñas) y la
   región más cercana (ej. `us-east-1` o `us-west-1`).
3. Espera unos minutos a que el proyecto termine de aprovisionarse.

## 2. Correr las migraciones en orden

Ve a **SQL Editor** (menú lateral) → **New query**, y corre estos archivos
**en orden**, uno por uno, pegando el contenido completo de cada archivo y
dando **Run**:

1. `supabase/migrations/001_schema.sql` — tablas, checks, trigger de `updated_at`.
2. `supabase/migrations/002_indexes.sql` — índices B-tree y GIN trigram.
3. `supabase/migrations/003_rls.sql` — Row Level Security, funciones
   `is_member()` / `is_admin()`, políticas y alta en Realtime.
4. `supabase/migrations/004_seed.sql` — datos reales (3 miembros, 4 frentes,
   8 actividades) extraídos del panel HTML original.

Verifica después de cada paso que no haya errores en la consola de resultados
antes de continuar con el siguiente archivo. Si algo falla a medio archivo,
revisa el mensaje de error, corrige y vuelve a correr solo ese archivo (todas
las sentencias usan `if not exists` / `drop policy if exists` donde aplica,
así que son re-ejecutables sin duplicar objetos).

## 3. Obtener URL y anon key

**Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **Project API keys → anon public** → `VITE_SUPABASE_ANON_KEY`

Nunca uses la key `service_role` en el frontend: solo el `anon` key debe
llegar al navegador (RLS protege el acceso a los datos).

## 4. Configurar las variables

**Local:**

```bash
cp .env.example .env
# edita .env y pega los valores de VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
```

**Railway:**

1. Abre el proyecto en Railway → el servicio del panel.
2. Pestaña **Variables** → **New Variable**.
3. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los mismos
   valores que en tu `.env` local.
4. Railway hará redeploy automáticamente al guardar las variables.

## 5. Invitar a los 3 usuarios y vincularlos

El seed real (`004_seed.sql`) crea 3 filas en `team_members` **sin**
`email` ni `auth_user_id` (Jeshua, CP Roberto, CP Blake), porque en el panel
original no había cuentas de autenticación, solo nombres.

1. **Dashboard → Authentication → Users → Invite user.** Envía la invitación
   al email real de cada una de las 3 personas (Jeshua, CP Roberto, CP Blake).
   Cada quien recibirá un correo para fijar su contraseña / hacer login.
2. Una vez que el usuario aparece en **Authentication → Users**, copia su
   `User UID`.
3. En **SQL Editor**, vincula cada `auth_user_id` y `email` a su fila en
   `team_members` (reemplaza los valores entre `<...>`):

```sql
update team_members
set auth_user_id = '<uuid-del-usuario-invitado>',
    email = '<email-real@dominio.com>'
where name = 'Jeshua';

update team_members
set auth_user_id = '<uuid-del-usuario-invitado>',
    email = '<email-real@dominio.com>'
where name = 'CP Roberto';

update team_members
set auth_user_id = '<uuid-del-usuario-invitado>',
    email = '<email-real@dominio.com>'
where name = 'CP Blake';
```

Hasta que `auth_user_id` esté vinculado, esa persona **no** podrá leer ni
escribir nada (las políticas RLS de `003_rls.sql` exigen
`team_members.auth_user_id = auth.uid()`), aunque ya tenga cuenta creada en
Auth.

Si se suman personas nuevas al equipo más adelante, un admin (Jeshua) puede
insertar la fila en `team_members` (o hacerlo vía SQL Editor) y repetir el
paso de invitar + vincular.

## 6. Correr el load test y leer los EXPLAIN

Después de que 001-004 estén aplicados, corre completo
`supabase/load_test_seed.sql` en el SQL Editor (es un solo script, se
ejecuta de una sola vez con **Run**). Genera ~3,000 actividades sintéticas,
20 miembros y 8 frentes extra, y ~12,000 notas y ~12,000 eventos, todo con
prefijo `LT` para poder identificarlo y borrarlo después:

```sql
delete from activities where title like 'LT-%';
delete from fronts where name like 'LT Frente%';
delete from team_members where name like 'LT Member%';
```

Al final del archivo hay 5 queries comentadas (bajo `-- explain analyze`),
representativas de los patrones reales del panel:

1. **Lista filtrada** del tablero (status + priority, ordenada por fecha límite).
2. **Búsqueda de texto libre** (título + descripción, vía índice GIN trigram).
3. **Detalle de una actividad con notas paginadas** (más recientes primero).
4. **KPIs globales** (conteo y avance promedio por status).
5. **Carga activa por responsable** (join con `activity_assignees`).

Para leerlas: descomenta una query a la vez en el SQL Editor y dale **Run**.
En el resultado de `EXPLAIN ANALYZE` busca:

- **`Index Scan` / `Bitmap Index Scan`** sobre los índices de
  `002_indexes.sql` (ej. `idx_activities_status`, `idx_activities_search_trgm`)
  en vez de **`Seq Scan`** sobre `activities` — un Seq Scan con miles de filas
  indica que el índice no se está usando (o que el planner decidió que no
  vale la pena para el tamaño actual de la tabla, lo cual es normal con
  pocas filas y debería desaparecer con el volumen del load test).
- **`Execution Time`** al final del plan: es el tiempo real que tardó la
  query completa.
- **`rows=`** estimado vs. real (`actual rows=`): diferencias grandes
  sugieren que las estadísticas de la tabla están desactualizadas — en ese
  caso corre `analyze activities;` (y las demás tablas) y vuelve a probar.
