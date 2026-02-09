-- =====================================================
-- Migration 009: user_model schema alignment (PRD)
--
-- Renames user_models → user_model and adds PRD-required
-- columns for the nightly learning loop, personalization,
-- and progressive unlock system.
--
-- Playbook: Week 1, Day 1 (GAP-11)
-- =====================================================

-- 1. Rename table
ALTER TABLE IF EXISTS public.user_models RENAME TO user_model;

-- 2. Add PRD-required columns for the learning loop
ALTER TABLE public.user_model
  ADD COLUMN IF NOT EXISTS voice_usage_rate           REAL DEFAULT 0,       -- voice commands per day (rolling 7d avg)
  ADD COLUMN IF NOT EXISTS common_reschedule_patterns JSONB DEFAULT '{}',   -- e.g. {"monday_morning": 0.3, "friday_evening": 0.2}
  ADD COLUMN IF NOT EXISTS tone_preference            TEXT DEFAULT 'warm',  -- user's preferred AI tone
  ADD COLUMN IF NOT EXISTS avg_task_durations         JSONB DEFAULT '{}',   -- e.g. {"Work": 45, "Personal": 20} (minutes)
  ADD COLUMN IF NOT EXISTS completion_rate_7d         REAL DEFAULT 0,       -- task completion rate over last 7 days (0.0-1.0)
  ADD COLUMN IF NOT EXISTS overwhelm_score            REAL DEFAULT 0,       -- 0.0-1.0 (high = user is overwhelmed)
  ADD COLUMN IF NOT EXISTS unlock_level               INTEGER DEFAULT 0,    -- 0=new, 1=day3, 2=day7, 3=day14, 4=day30
  ADD COLUMN IF NOT EXISTS focus_efficiency           REAL DEFAULT 0,       -- actual/planned ratio for focus sessions
  ADD COLUMN IF NOT EXISTS preferred_focus_duration    INTEGER DEFAULT 25,   -- user's typical focus session length (minutes)
  ADD COLUMN IF NOT EXISTS active_days_count          INTEGER DEFAULT 0;    -- total days with at least 1 action

-- 3. Update RLS policies (old policies reference user_models)
DROP POLICY IF EXISTS "user_models_select" ON public.user_model;

CREATE POLICY "user_model_select"
  ON public.user_model FOR SELECT
  USING (auth.uid() = user_id);

-- user_model is written by calculate-unlocks edge function (service role),
-- NOT by the client. No INSERT/UPDATE policy for authenticated role.

-- 4. Enable RLS
ALTER TABLE public.user_model ENABLE ROW LEVEL SECURITY;
