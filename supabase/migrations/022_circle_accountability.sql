-- =====================================================
-- CIRCLE ACCOUNTABILITY SYSTEM
-- Tables: circle_checkins, circle_checkouts, circle_posts
-- Supports daily check-in/check-out per circle per user
-- =====================================================

-- =====================================================
-- CIRCLE CHECK-INS
-- One per user per circle per day (enforced by unique constraint)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.circle_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  intention_text TEXT NOT NULL,
  committed_task_ids UUID[] DEFAULT '{}',
  committed_focus_minutes INTEGER,
  committed_challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  proof_type TEXT DEFAULT 'none' CHECK (proof_type IN ('none', 'photo', 'voice')),
  proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Enforce: 1 check-in per user per circle per day
  UNIQUE(circle_id, user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_checkins_circle_date ON public.circle_checkins(circle_id, date);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON public.circle_checkins(user_id, date);

-- =====================================================
-- CIRCLE CHECK-OUTS
-- One per user per circle per day (enforced by unique constraint)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.circle_checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  result_status TEXT NOT NULL CHECK (result_status IN ('done', 'partial', 'missed')),
  completed_task_ids UUID[] DEFAULT '{}',
  reflection_win TEXT,
  reflection_blocker TEXT,
  proof_type TEXT DEFAULT 'none' CHECK (proof_type IN ('none', 'photo', 'voice')),
  proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Enforce: 1 check-out per user per circle per day
  UNIQUE(circle_id, user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_checkouts_circle_date ON public.circle_checkouts(circle_id, date);
CREATE INDEX IF NOT EXISTS idx_checkouts_user_date ON public.circle_checkouts(user_id, date);

-- =====================================================
-- CIRCLE POSTS (Feed)
-- Unified feed for all circle activity
-- =====================================================
CREATE TABLE IF NOT EXISTS public.circle_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'checkin', 'checkout',
    'challenge_created', 'challenge_completed',
    'milestone', 'achievement', 'member_joined'
  )),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_circle_created ON public.circle_posts(circle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.circle_posts(user_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.circle_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_posts ENABLE ROW LEVEL SECURITY;

-- Helper: is_circle_member(uuid, uuid) already exists from earlier migrations
-- Skipping re-creation to avoid parameter name conflicts

-- CIRCLE_CHECKINS policies
DROP POLICY IF EXISTS "Circle members can view checkins" ON public.circle_checkins;
CREATE POLICY "Circle members can view checkins"
  ON public.circle_checkins FOR SELECT
  USING (public.is_circle_member(circle_id, auth.uid()));

DROP POLICY IF EXISTS "Users can insert own checkins" ON public.circle_checkins;
CREATE POLICY "Users can insert own checkins"
  ON public.circle_checkins FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_circle_member(circle_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own checkins" ON public.circle_checkins;
CREATE POLICY "Users can update own checkins"
  ON public.circle_checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- CIRCLE_CHECKOUTS policies
DROP POLICY IF EXISTS "Circle members can view checkouts" ON public.circle_checkouts;
CREATE POLICY "Circle members can view checkouts"
  ON public.circle_checkouts FOR SELECT
  USING (public.is_circle_member(circle_id, auth.uid()));

DROP POLICY IF EXISTS "Users can insert own checkouts" ON public.circle_checkouts;
CREATE POLICY "Users can insert own checkouts"
  ON public.circle_checkouts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_circle_member(circle_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own checkouts" ON public.circle_checkouts;
CREATE POLICY "Users can update own checkouts"
  ON public.circle_checkouts FOR UPDATE
  USING (auth.uid() = user_id);

-- CIRCLE_POSTS policies
DROP POLICY IF EXISTS "Circle members can view posts" ON public.circle_posts;
CREATE POLICY "Circle members can view posts"
  ON public.circle_posts FOR SELECT
  USING (public.is_circle_member(circle_id, auth.uid()));

DROP POLICY IF EXISTS "Users can insert own posts" ON public.circle_posts;
CREATE POLICY "Users can insert own posts"
  ON public.circle_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_circle_member(circle_id, auth.uid())
  );

-- Grant access
GRANT ALL ON public.circle_checkins TO authenticated;
GRANT ALL ON public.circle_checkouts TO authenticated;
GRANT ALL ON public.circle_posts TO authenticated;
