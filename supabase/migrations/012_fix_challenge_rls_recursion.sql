-- =====================================================
-- Migration 012: Fix RLS recursion on challenge_participants
-- 
-- Problem: challenge_participants_select policy references 
-- challenge_participants itself, causing infinite recursion.
-- Same issue with challenges_select which also queries
-- challenge_participants (triggering the recursive policy).
--
-- Fix: SECURITY DEFINER function (bypasses RLS) to check
-- participation, same pattern as is_circle_member.
-- =====================================================

-- 1. Create helper function to check challenge participation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_challenge_participant(_challenge_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.challenge_participants 
    WHERE challenge_id = _challenge_id AND user_id = _user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Create helper to check challenge creator (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_challenge_creator(_challenge_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE id = _challenge_id AND creator_id = _user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Fix challenge_participants policies (drop recursive ones)
DROP POLICY IF EXISTS "challenge_participants_select" ON public.challenge_participants;
DROP POLICY IF EXISTS "challenge_participants_insert" ON public.challenge_participants;
DROP POLICY IF EXISTS "challenge_participants_update" ON public.challenge_participants;
DROP POLICY IF EXISTS "challenge_participants_delete" ON public.challenge_participants;

CREATE POLICY "challenge_participants_select" ON public.challenge_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_challenge_participant(challenge_id, auth.uid())
    OR public.is_challenge_creator(challenge_id, auth.uid())
  );

CREATE POLICY "challenge_participants_insert" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "challenge_participants_update" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "challenge_participants_delete" ON public.challenge_participants
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Fix challenges policies (also referenced challenge_participants directly)
DROP POLICY IF EXISTS "challenges_select" ON public.challenges;
DROP POLICY IF EXISTS "challenges_insert" ON public.challenges;
DROP POLICY IF EXISTS "challenges_update" ON public.challenges;
DROP POLICY IF EXISTS "challenges_delete" ON public.challenges;

CREATE POLICY "challenges_select" ON public.challenges
  FOR SELECT USING (
    creator_id = auth.uid()
    OR public.is_challenge_participant(id, auth.uid())
    OR (circle_id IS NOT NULL AND public.is_circle_member(circle_id, auth.uid()))
  );

CREATE POLICY "challenges_insert" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "challenges_update" ON public.challenges
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "challenges_delete" ON public.challenges
  FOR DELETE USING (auth.uid() = creator_id);
