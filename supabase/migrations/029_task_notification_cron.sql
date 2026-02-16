-- Migration 029: Task notification cron job + send-push category fix
--
-- 1. Schedule hourly task-notifications edge function call
--    that checks for overdue & due-soon tasks and creates notifications.
--
-- 2. No schema changes needed — notifications table already supports
--    the required columns from migration 028.

-- ── 1. Hourly overdue / due-soon notification scan ───────────────────
-- Runs every 30 minutes to catch tasks promptly
SELECT cron.schedule(
  'task-notifications-scan',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://exztrtyvjipikqexpirr.supabase.co/functions/v1/task-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
