-- =====================================================
-- 024: CHALLENGE CHECK-INS + ANALYTICS COLUMNS
-- Adds: challenge_checkins table, tracking_method/verification_mode
-- to challenges, challenge columns to daily_user_stats
-- =====================================================

-- =====================================================
-- 1. CHALLENGE_CHECKINS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenge_checkins (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id    UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id        UUID NOT NULL UNIQUE,  -- idempotency key
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

-- =====================================================
-- 2. ADD tracking_method + verification_mode TO challenges
-- =====================================================
-- tracking_method: 'auto' (system counts tasks/focus) or 'manual' (user checks in)
-- verification_mode: 'auto_accept' or 'creator_approval'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenges' AND column_name = 'tracking_method'
  ) THEN
    ALTER TABLE public.challenges ADD COLUMN tracking_method TEXT NOT NULL DEFAULT 'auto'
      CHECK (tracking_method IN ('auto', 'manual'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenges' AND column_name = 'verification_mode'
  ) THEN
    ALTER TABLE public.challenges ADD COLUMN verification_mode TEXT NOT NULL DEFAULT 'auto_accept'
      CHECK (verification_mode IN ('auto_accept', 'creator_approval'));
  END IF;
END $$;

-- =====================================================
-- 3. ADD challenge columns TO daily_user_stats
-- =====================================================
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

-- =====================================================
-- 4. RLS POLICIES for challenge_checkins
-- =====================================================
ALTER TABLE public.challenge_checkins ENABLE ROW LEVEL SECURITY;

-- Users can view check-ins for challenges they participate in
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

-- Users can insert own check-ins
DROP POLICY IF EXISTS "Users can insert own checkins" ON public.challenge_checkins;
CREATE POLICY "Users can insert own checkins"
  ON public.challenge_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update check-ins they're reviewing (challenge creators)
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

-- =====================================================
-- 5. GRANTS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON public.challenge_checkins TO authenticated;
GRANT ALL ON public.challenge_checkins TO service_role;
