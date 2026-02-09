-- =====================================================
-- Migration 008: event_log schema alignment (PRD 4.8)
--
-- Renames user_events → event_log and adds all PRD-required
-- columns for voice analytics, cost tracking, and the
-- learning loop (nightly user_model computation).
--
-- Playbook: Week 1, Day 1 (GAP-02)
-- =====================================================

-- 1. Rename table
ALTER TABLE IF EXISTS public.user_events RENAME TO event_log;

-- 2. Add PRD-required columns
ALTER TABLE public.event_log
  ADD COLUMN IF NOT EXISTS action         TEXT,            -- e.g. 'create_task', 'complete_task', 'voice_command'
  ADD COLUMN IF NOT EXISTS intent_raw     TEXT,            -- raw transcript or UI action string
  ADD COLUMN IF NOT EXISTS ai_model_used  TEXT,            -- e.g. 'gpt-4o-mini-2024-07-18'
  ADD COLUMN IF NOT EXISTS confidence     REAL,            -- 0.0-1.0 from GPT function-calling
  ADD COLUMN IF NOT EXISTS tokens_used    INTEGER,         -- prompt + completion tokens (for cost tracking)
  ADD COLUMN IF NOT EXISTS user_override  BOOLEAN DEFAULT FALSE,  -- did user cancel/correct the AI?
  ADD COLUMN IF NOT EXISTS latency_ms     INTEGER,         -- end-to-end voice processing time
  ADD COLUMN IF NOT EXISTS error_code     TEXT,            -- error identifier if action failed
  ADD COLUMN IF NOT EXISTS success        BOOLEAN DEFAULT TRUE,   -- did the action succeed?
  ADD COLUMN IF NOT EXISTS screen_context TEXT,            -- which screen/modal was active
  ADD COLUMN IF NOT EXISTS params         JSONB DEFAULT '{}';     -- structured action parameters

-- 3. Rename old indexes to match new table name
ALTER INDEX IF EXISTS user_events_user_id_idx RENAME TO event_log_user_id_idx;
ALTER INDEX IF EXISTS user_events_created_at_idx RENAME TO event_log_created_at_idx;

-- 4. Composite index for usage counter computation (PRD rule 13)
-- Replaces the one from migration 006 that referenced the old table name
DROP INDEX IF EXISTS idx_user_events_user_type_created;
CREATE INDEX IF NOT EXISTS idx_event_log_user_type_created
  ON public.event_log(user_id, event_type, created_at);

-- 5. Index for voice success rate / latency analytics
CREATE INDEX IF NOT EXISTS idx_event_log_user_action_created
  ON public.event_log(user_id, action, created_at);

-- 6. Update RLS policies (old policies reference user_events)
DROP POLICY IF EXISTS "user_events_select" ON public.event_log;
DROP POLICY IF EXISTS "user_events_insert" ON public.event_log;

CREATE POLICY "event_log_select"
  ON public.event_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "event_log_insert"
  ON public.event_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. Enable RLS (ensure it's on after rename)
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

-- 8. Add to Realtime publication for live dashboards (optional)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.event_log;
EXCEPTION WHEN SQLSTATE '42710' THEN NULL; -- already member
END $$;
