-- ============================================================================
-- 006_zoom_cron.sql
-- Agenda cron para sincronización de Zoom.
--
-- Programa un job que ejecuta cada 15 minutos una Edge Function (zoom-sync)
-- que descarga las reuniones de Zoom y sincroniza la tabla sessions. Requiere
-- las extensiones pg_cron (PostgreSQL) y pg_net (HTTP POST desde SQL).
--
-- NOTA: reemplazar __ANON_KEY__ por el anon/publishable key real al aplicar;
-- NO commitear el key real en control de versiones.
-- ============================================================================

-- ── extensiones ───────────────────────────────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ── limpiar job anterior si existe ─────────────────────────────────────────
-- (idempotente: si no existe, la consulta interna devuelve false sin error)
do $$
begin
  perform cron.unschedule('zoom-sync-every-15min')
    where exists (select 1 from cron.job where jobname = 'zoom-sync-every-15min');
end $$;

-- ── agenda: ejecutar zoom-sync cada 15 minutos ─────────────────────────────
select cron.schedule(
  'zoom-sync-every-15min',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := 'https://hfffaxjfcpgvbtlgyfgn.supabase.co/functions/v1/zoom-sync',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer __ANON_KEY__"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
