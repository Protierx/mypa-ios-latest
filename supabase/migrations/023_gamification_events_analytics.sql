-- =====================================================
-- GAMIFICATION EVENT SYSTEM + ANALYTICS AGGREGATES
-- Tables: events, user_gamification_state, daily_user_stats, challenge_progress
-- Canonical task-completion processing flow
-- =====================================================

-- =====================================================
-- 1. EVENTS TABLE (idempotent event log)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id    UUID NOT NULL UNIQUE,                       -- client-generated idempotency key
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL,                               -- e.g. 'task_completed'
  task_id     UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  circle_id   UUID REFERENCES public.circles(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user      ON public.events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type      ON public.events(type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_id  ON public.events(event_id);

-- =====================================================
-- 2. USER GAMIFICATION STATE (single row per user)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_gamification_state (
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  total_xp          INTEGER NOT NULL DEFAULT 0,
  level             INTEGER NOT NULL DEFAULT 1,
  xp_into_level     INTEGER NOT NULL DEFAULT 0,
  xp_for_next_level INTEGER NOT NULL DEFAULT 100,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_active_date  DATE,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. DAILY USER STATS (one row per user per day)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_user_stats (
  user_id                UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date                   DATE NOT NULL,
  tasks_completed        INTEGER NOT NULL DEFAULT 0,
  tasks_completed_on_time INTEGER NOT NULL DEFAULT 0,
  tasks_completed_late   INTEGER NOT NULL DEFAULT 0,
  overdue_recovered      INTEGER NOT NULL DEFAULT 0,
  focus_minutes          INTEGER NOT NULL DEFAULT 0,
  xp_gained              INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_user_stats(user_id, date DESC);

-- =====================================================
-- 4. CHALLENGE PROGRESS (per-challenge per-user)
--    Supplements the existing challenge_participants table
--    with progress tracking + consistency-challenge deduplication
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenge_progress (
  challenge_id      UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  progress_value    INTEGER NOT NULL DEFAULT 0,
  last_counted_date DATE,                                  -- for consistency challenge dedupe
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (challenge_id, user_id)
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

-- EVENTS: users can read/write own events only
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
CREATE POLICY "Users can view own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
CREATE POLICY "Users can insert own events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- USER_GAMIFICATION_STATE: users can read/write own row only
DROP POLICY IF EXISTS "Users can view own gamification state" ON public.user_gamification_state;
CREATE POLICY "Users can view own gamification state"
  ON public.user_gamification_state FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own gamification state" ON public.user_gamification_state;
CREATE POLICY "Users can upsert own gamification state"
  ON public.user_gamification_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DAILY_USER_STATS: users can read/write own rows only
DROP POLICY IF EXISTS "Users can view own daily stats" ON public.daily_user_stats;
CREATE POLICY "Users can view own daily stats"
  ON public.daily_user_stats FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own daily stats" ON public.daily_user_stats;
CREATE POLICY "Users can upsert own daily stats"
  ON public.daily_user_stats FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CHALLENGE_PROGRESS: users can read own or circle-member progress
DROP POLICY IF EXISTS "Users can view own challenge progress" ON public.challenge_progress;
CREATE POLICY "Users can view own challenge progress"
  ON public.challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own challenge progress" ON public.challenge_progress;
CREATE POLICY "Users can upsert own challenge progress"
  ON public.challenge_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- GRANTS (service role + authenticated)
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_gamification_state TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.daily_user_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.challenge_progress TO authenticated;

GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.user_gamification_state TO service_role;
GRANT ALL ON public.daily_user_stats TO service_role;
GRANT ALL ON public.challenge_progress TO service_role;
