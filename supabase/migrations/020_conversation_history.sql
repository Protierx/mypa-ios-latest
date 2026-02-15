-- =====================================================
-- Migration 014: conversation_history table
--
-- Stores post-call summaries from the ElevenLabs webhook.
-- Used for cross-session memory — the last 3 summaries are
-- injected as context when a new voice session starts, so
-- MYPA remembers what you talked about.
--
-- Plan: ELEVENLABS_VOICE_MIGRATION_PLAN.md Step 11b / 15c
-- =====================================================

-- 1. Create conversation_history table
CREATE TABLE IF NOT EXISTS public.conversation_history (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id TEXT NOT NULL,
  summary       TEXT NOT NULL,                    -- LLM-generated summary from ElevenLabs analysis
  key_decisions JSONB DEFAULT '[]'::jsonb,        -- e.g. ["reschedule_task: Moved gym to Tuesday"]
  action_items  JSONB DEFAULT '[]'::jsonb,        -- tools used: [{ tool: "create_task" }, ...]
  mood          TEXT,                             -- user's detected mood (calm, stressed, etc.)
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Index for efficient lookup (latest N conversations per user)
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_created
  ON public.conversation_history(user_id, created_at DESC);

-- 3. Unique constraint: one row per conversation
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_history_conv_id
  ON public.conversation_history(conversation_id);

-- 4. RLS — users can read their own history; writes via service role (webhook)
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation_history_select" ON public.conversation_history;
CREATE POLICY "conversation_history_select"
  ON public.conversation_history FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE policy for authenticated role.
-- The webhook edge function uses SUPABASE_SERVICE_ROLE_KEY to write.

-- 5. Grant service_role full access (edge functions use service role)
GRANT ALL ON public.conversation_history TO service_role;

-- 6. Grant authenticated users SELECT only
GRANT SELECT ON public.conversation_history TO authenticated;
