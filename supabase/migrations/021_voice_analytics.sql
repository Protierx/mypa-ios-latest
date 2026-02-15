-- Migration 017: Voice Analytics Aggregate Table (Step 18b)
--
-- Stores daily voice interaction metrics per user.
-- Upserted by the elevenlabs-webhook edge function after each conversation.
-- Read by the frontend analytics dashboard.

CREATE TABLE IF NOT EXISTS public.voice_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sessions_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  tasks_created_by_voice INTEGER DEFAULT 0,
  avg_satisfaction REAL DEFAULT 0,
  avg_task_completion REAL DEFAULT 0,
  top_commands JSONB DEFAULT '[]'::jsonb,
  interruption_rate REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Index for fast per-user date range queries (dashboard charts)
CREATE INDEX IF NOT EXISTS idx_voice_analytics_user_date
  ON public.voice_analytics (user_id, date DESC);

-- Enable RLS
ALTER TABLE public.voice_analytics ENABLE ROW LEVEL SECURITY;

-- Users can read their own analytics
DROP POLICY IF EXISTS "Users can read own voice_analytics" ON public.voice_analytics;
CREATE POLICY "Users can read own voice_analytics"
  ON public.voice_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (webhook) can insert/update — no user-facing INSERT policy needed
-- The webhook uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.

-- Grant usage to authenticated role (read only)
GRANT SELECT ON public.voice_analytics TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: upsert_voice_analytics
-- Called by the webhook to properly aggregate daily metrics (running averages,
-- incrementing counters, merging top_commands).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_voice_analytics(
  p_user_id UUID,
  p_date DATE,
  p_duration INTEGER,
  p_tasks_created INTEGER,
  p_satisfaction REAL,
  p_task_completion REAL,
  p_top_commands JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing RECORD;
  v_new_count INTEGER;
  v_merged_commands JSONB;
BEGIN
  -- Check if row exists for this user+date
  SELECT * INTO v_existing
  FROM public.voice_analytics
  WHERE user_id = p_user_id AND date = p_date;

  IF FOUND THEN
    -- Aggregate into existing row
    v_new_count := v_existing.sessions_count + 1;

    -- Merge top_commands: combine frequency maps, keep top 10
    WITH
      existing_cmds AS (
        SELECT elem->>'name' AS name, (elem->>'count')::int AS count
        FROM jsonb_array_elements(COALESCE(v_existing.top_commands, '[]'::jsonb)) AS elem
      ),
      new_cmds AS (
        SELECT elem->>'name' AS name, (elem->>'count')::int AS count
        FROM jsonb_array_elements(COALESCE(p_top_commands, '[]'::jsonb)) AS elem
      ),
      merged AS (
        SELECT name, SUM(count) AS count
        FROM (SELECT * FROM existing_cmds UNION ALL SELECT * FROM new_cmds) AS all_cmds
        GROUP BY name
        ORDER BY SUM(count) DESC
        LIMIT 10
      )
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'count', count)), '[]'::jsonb)
    INTO v_merged_commands
    FROM merged;

    UPDATE public.voice_analytics SET
      sessions_count = v_new_count,
      total_duration_seconds = v_existing.total_duration_seconds + p_duration,
      tasks_created_by_voice = v_existing.tasks_created_by_voice + p_tasks_created,
      -- Running average: new_avg = old_avg + (new_value - old_avg) / new_count
      avg_satisfaction = v_existing.avg_satisfaction
        + (p_satisfaction - v_existing.avg_satisfaction) / v_new_count,
      avg_task_completion = v_existing.avg_task_completion
        + (p_task_completion - v_existing.avg_task_completion) / v_new_count,
      top_commands = v_merged_commands
    WHERE user_id = p_user_id AND date = p_date;
  ELSE
    -- Insert fresh row for today
    INSERT INTO public.voice_analytics (
      user_id, date, sessions_count, total_duration_seconds,
      tasks_created_by_voice, avg_satisfaction, avg_task_completion,
      top_commands, interruption_rate
    ) VALUES (
      p_user_id, p_date, 1, p_duration,
      p_tasks_created, p_satisfaction, p_task_completion,
      COALESCE(p_top_commands, '[]'::jsonb), 0
    );
  END IF;
END;
$$;
