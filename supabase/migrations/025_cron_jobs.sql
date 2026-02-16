-- Migration 025: pg_cron scheduled jobs
-- Prerequisite: Supabase Pro plan with pg_cron enabled
-- Reference: IMPLEMENTATION_PLAN.md Task 1.3
--
-- IMPORTANT: Replace <SERVICE_ROLE_KEY> with your actual service role key
-- from Supabase Dashboard → Settings → API → service_role key.
-- 
-- NOTE: This migration will fail if pg_cron is not enabled (requires Supabase Pro).
-- If not on Pro yet, save this and run manually after upgrading.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── 1. Nightly user_model computation (2:00 AM UTC) ──────────────────
-- Calls compute-user-model edge function for all active users
SELECT cron.schedule(
  'compute-user-models',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://exztrtyvjipikqexpirr.supabase.co/functions/v1/compute-user-model',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 2. Nightly unlock calculation (2:30 AM UTC) ──────────────────────
-- Checks and grants feature unlocks for all users
SELECT cron.schedule(
  'calculate-unlocks',
  '30 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://exztrtyvjipikqexpirr.supabase.co/functions/v1/calculate-unlocks',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 3. Hourly briefing pre-generation ────────────────────────────────
-- Runs every hour, the edge function filters for users at 6 AM local
SELECT cron.schedule(
  'pre-generate-briefings',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://exztrtyvjipikqexpirr.supabase.co/functions/v1/daily-brief',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{"pregenerate": true}'::jsonb
  );
  $$
);

-- ── 4. 90-day event log cleanup (3:00 AM UTC daily) ──────────────────
-- Deletes event_log rows older than 90 days to manage storage
SELECT cron.schedule(
  'cleanup-old-events',
  '0 3 * * *',
  $$DELETE FROM event_log WHERE created_at < now() - INTERVAL '90 days'$$
);
