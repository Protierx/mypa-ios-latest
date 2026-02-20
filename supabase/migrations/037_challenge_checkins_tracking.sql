-- =====================================================
-- Migration 037: Create challenge_checkins table + tracking columns
-- Backfills tracking_method / verification_mode on challenges table.
-- Safe to re-run (all CREATE IF NOT EXISTS / DO $$ guards).
-- =====================================================

-- 1. challenge_checkins table
CREATE TABLE IF NOT EXISTS public.challenge_checkins (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id    UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id        UUID NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected')),
  note            TEXT,
  proof_url       TEXT,
  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkins_challenge_user
  ON public.challenge_checkins(challenge_id, user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_event_id
  ON public.challenge_checkins(event_id);

-- 2. Add tracking_method column (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenges' AND column_name = 'tracking_method'
  ) THEN
    ALTER TABLE public.challenges
      ADD COLUMN tracking_method TEXT DEFAULT 'tasks_completed'
      CHECK (tracking_method IN ('tasks_completed', 'focus_minutes', 'active_days', 'proof_checkin'));
  END IF;
END $$;

-- 3. Add verification_mode column (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenges' AND column_name = 'verification_mode'
  ) THEN
    ALTER TABLE public.challenges
      ADD COLUMN verification_mode TEXT DEFAULT NULL
      CHECK (verification_mode IS NULL OR verification_mode IN ('auto_accept', 'creator_approval'));
  END IF;
END $$;

-- 4. Add challenge columns to daily_user_stats (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_user_stats' AND column_name = 'challenge_checkins_accepted'
  ) THEN
    ALTER TABLE public.daily_user_stats
      ADD COLUMN challenge_checkins_accepted INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_user_stats' AND column_name = 'challenges_completed'
  ) THEN
    ALTER TABLE public.daily_user_stats
      ADD COLUMN challenges_completed INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 5. RLS for challenge_checkins
ALTER TABLE public.challenge_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view challenge checkins" ON public.challenge_checkins;
CREATE POLICY "Users can view challenge checkins"
  ON public.challenge_checkins FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.challenge_id = challenge_checkins.challenge_id
        AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own checkins" ON public.challenge_checkins;
CREATE POLICY "Users can insert own checkins"
  ON public.challenge_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Challenge creators can update checkins" ON public.challenge_checkins;
CREATE POLICY "Challenge creators can update checkins"
  ON public.challenge_checkins FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_checkins.challenge_id
        AND c.creator_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.challenge_checkins TO authenticated;
GRANT ALL ON public.challenge_checkins TO service_role;

-- 6. Backfill tracking_method for existing rows
UPDATE public.challenges SET tracking_method = 'tasks_completed'
  WHERE tracking_method IS NULL AND type = 'tasks_completed';
UPDATE public.challenges SET tracking_method = 'focus_minutes'
  WHERE tracking_method IS NULL AND type = 'focus_time';
UPDATE public.challenges SET tracking_method = 'active_days'
  WHERE tracking_method IS NULL AND type = 'daily_checkin';
UPDATE public.challenges SET tracking_method = 'proof_checkin'
  WHERE tracking_method IS NULL AND type IS NOT NULL AND tracking_method IS NULL;
-- Fallback: anything still NULL
UPDATE public.challenges SET tracking_method = 'tasks_completed'
  WHERE tracking_method IS NULL;
