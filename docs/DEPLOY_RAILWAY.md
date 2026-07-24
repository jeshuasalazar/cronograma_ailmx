# Despliegue en Railway

El panel es una app Vite que se compila a estáticos (`dist/`) y se sirve con
`serve`. Railway la construye con Nixpacks y la arranca con `npm run start`
(escucha en `$PORT`, ya configurado). La config está fijada en `railway.json`.

## 1. Variables de entorno (¡obligatorias y en tiempo de BUILD!)

Vite **incrusta** las variables `VITE_*` en el bundle **durante el build**, no
en runtime. Por eso hay que definirlas en Railway **antes** de desplegar:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://hfffaxjfcpgvbtlgyfgn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | tu **publishable/anon key** (`sb_publishable_…`) — Supabase → Settings → API |

> **No** definas `NODE_ENV=production`: Vite es una devDependency necesaria para
> el build; con `NODE_ENV=production` Railway omitiría las devDependencies y el
> build fallaría. Railway/Nixpacks instala todo por defecto — déjalo así.

## 2. Desplegar (opción dashboard)

1. [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub
   repo** → `jeshuasalazar/cronograma_ailmx` (rama `main`).
2. En el servicio → **Variables** → agrega las dos `VITE_*` de arriba.
3. **Settings → Networking → Generate Domain** para obtener la URL pública.
4. Railway hace build (`npm run build`) y start (`npm run start`) automáticamente.

## 2b. Desplegar (opción CLI)

```bash
railway login
railway link            # elige/crea el proyecto
railway variables --set VITE_SUPABASE_URL=https://hfffaxjfcpgvbtlgyfgn.supabase.co
railway variables --set VITE_SUPABASE_ANON_KEY=sb_publishable_...
railway up              # build + deploy
railway domain          # genera dominio público
```

## 3. Post-deploy: ajustar Supabase Auth

Una vez que tengas la URL pública de Railway (`https://<algo>.up.railway.app`):

- Supabase → **Authentication → URL Configuration**:
  - **Site URL** = la URL de Railway.
  - **Redirect URLs** = agrega la URL de Railway (para magic links / OAuth).

Sin esto, el login por email/enlace redirige a la URL vieja.

## 4. Notas

- El sync de Zoom (Edge Functions + cron + webhook) es independiente de Railway:
  ya vive en Supabase. Railway solo sirve el frontend.
- `serve --single` sirve `index.html` para cualquier ruta (SPA-safe).
