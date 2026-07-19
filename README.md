# Cronograma aiLearning

Panel de operaciones, cronograma y brand kit de aiLearning. Stack: **Vite +
Supabase**, con un modo demo local (localStorage) que funciona sin
credenciales, y las páginas legadas (panel HTML original, cronograma, brand
manual) preservadas tal cual en sus mismas URLs.

## Estructura

```
index.html          # entry de Vite — nueva app del panel ("/")
app/                 # código nuevo de la app (NO tocar public/src, es otra cosa)
  main.js            # entry provisional — la UI real la reemplaza
  supabaseClient.js  # cliente Supabase + isDemoMode
  auth.js            # initAuth/signIn/signOut/onAuthChange/getCurrentMember
  store.js           # cache tipo query: getQuery/invalidate/mutate
  repo/
    index.js         # elige localRepo o supabaseRepo según isDemoMode (interfaz documentada ahí)
    localRepo.js      # implementación sobre localStorage ("ail_ops_v3")
    supabaseRepo.js    # implementación sobre Supabase (ver supabase/migrations/)
    seedData.js         # datos semilla (espejo de supabase/migrations/004_seed.sql)
    importExport.js      # exportJSON/importJSON, incluye migración desde "ail_ops_v2" (panel legado)
public/              # TODO lo legado, servido en las mismas URLs de siempre
  "Panel Operaciones aiLearning.html"
  "Cronograma aiLearning.html"     # usa doc-page.js
  "Brand Manual aiLearning.html"   # carga src/*.jsx con Babel in-browser (NO procesado por Vite)
  src/*.jsx
  assets/, uploads/, doc-page.js, .thumbnail
supabase/            # migraciones SQL del esquema real (001-004) + load test
docs/SUPABASE_SETUP.md  # cómo provisionar el proyecto de Supabase paso a paso
```

`public/` se copia íntegro a `dist/` en cada build — todas las URLs que ya
existían (`/Panel%20Operaciones%20aiLearning.html`, `/src/data.jsx`,
`/assets/logo-mark.png`, etc.) siguen funcionando exactamente igual.

## Desarrollo

```bash
npm install
npm run dev       # servidor de Vite con hot reload, http://localhost:5173
npm run build     # build de producción a dist/
npm run preview   # sirve dist/ localmente para probar el build
```

## Variables de entorno

Copia `.env.example` a `.env` (o `.env.local`) y rellena:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Consíguelas en tu proyecto de Supabase → **Settings → API** (usa la key
**anon public**, nunca la `service_role` en el frontend). Ver
`docs/SUPABASE_SETUP.md` para provisionar el proyecto (correr las
migraciones de `supabase/migrations/` en orden, invitar usuarios, etc.).

### Modo demo

Si `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` no están definidas, la app
arranca en **modo demo** automáticamente: `isDemoMode = true`
(`app/supabaseClient.js`), el login se simula (usuario "Demo") y todos los
datos viven en `localStorage` bajo la clave `ail_ops_v3`, inicializados con
el mismo cronograma real que traía el panel original (ver
`app/repo/seedData.js`). Es el modo por default en desarrollo local sin
configurar nada, y sirve para que la UI se construya y pruebe sin depender
de Supabase.

## Railway

Railway detecta Node.js y, al existir los scripts `build`/`start`, corre el
build automáticamente antes de arrancar:

```bash
npm run build   # (automático)
npm start       # sirve dist/ con `serve`, puerto $PORT
```

Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Railway →
servicio → **Variables** para conectar a Supabase en producción (si se
omiten, producción también cae en modo demo).

La raíz (`/`) ahora sirve la nueva app del panel (antes redirigía a
`Panel Operaciones aiLearning.html`, que sigue disponible en su URL
original si se necesita).
