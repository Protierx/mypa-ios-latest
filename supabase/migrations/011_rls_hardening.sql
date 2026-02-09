-- =====================================================
-- Migration 011: RLS Hardening (GAP-01, CRITICAL)
--
-- Migration 005 set SELECT USING (true) on most tables,
-- meaning any user can read any other user's data.
-- This migration replaces those with strict policies.
--
-- To avoid infinite recursion (the reason 005 went nuclear),
-- we use a SECURITY DEFINER function for circle membership
-- checks that bypasses RLS.
--
-- Playbook: Week 1, Day 2
-- =====================================================

-- =====================================================
-- STEP 1: Create helper function (bypasses RLS)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_circle_member(_circle_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = _circle_id AND user_id = _user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 2: Drop ALL existing policies (clean slate)
-- =====================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: PROFILES
-- SELECT: open (display_name, avatar, xp, level are public game info)
-- INSERT/UPDATE: own only
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- STEP 4: TASKS — own tasks + circle tasks if member
-- =====================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    auth.uid() = user_id
    OR (circle_id IS NOT NULL AND public.is_circle_member(circle_id, auth.uid()))
  );

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: CIRCLES — member, owner, or public
-- Uses security definer function to avoid recursion
-- =====================================================

ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "circles_select" ON public.circles
  FOR SELECT USING (
    owner_id = auth.uid()
    OR privacy = 'public'
    OR public.is_circle_member(id, auth.uid())
  );

CREATE POLICY "circles_insert" ON public.circles
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "circles_update" ON public.circles
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "circles_delete" ON public.circles
  FOR DELETE USING (auth.uid() = owner_id);

-- =====================================================
-- STEP 6: CIRCLE_MEMBERS — own rows + co-members
-- Uses security definer function to avoid recursion
-- =====================================================

ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "circle_members_select" ON public.circle_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_circle_member(circle_id, auth.uid())
  );

CREATE POLICY "circle_members_insert" ON public.circle_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "circle_members_delete" ON public.circle_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.circles c
      WHERE c.id = circle_members.circle_id AND c.owner_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 7: CHALLENGES — creator, participant, or circle member
-- =====================================================

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_select" ON public.challenges
  FOR SELECT USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.challenge_id = challenges.id AND cp.user_id = auth.uid()
    )
    OR (circle_id IS NOT NULL AND public.is_circle_member(circle_id, auth.uid()))
  );

CREATE POLICY "challenges_insert" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "challenges_update" ON public.challenges
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "challenges_delete" ON public.challenges
  FOR DELETE USING (auth.uid() = creator_id);

-- =====================================================
-- STEP 8: CHALLENGE_PARTICIPANTS — own + co-participants
-- =====================================================

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenge_participants_select" ON public.challenge_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.challenge_participants cp2
      WHERE cp2.challenge_id = challenge_participants.challenge_id
        AND cp2.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
        AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "challenge_participants_insert" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "challenge_participants_update" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "challenge_participants_delete" ON public.challenge_participants
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 9: FOCUS_SESSIONS — own only
-- =====================================================

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "focus_sessions_select" ON public.focus_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "focus_sessions_insert" ON public.focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "focus_sessions_update" ON public.focus_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "focus_sessions_delete" ON public.focus_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 10: EVENT_LOG — own only
-- (migration 008 already created policies, but drop & recreate
--  for consistency in case they were overridden)
-- =====================================================

ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_log_select" ON public.event_log;
DROP POLICY IF EXISTS "event_log_insert" ON public.event_log;

CREATE POLICY "event_log_select" ON public.event_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "event_log_insert" ON public.event_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- STEP 11: USER_MODEL — own only (read-only for client)
-- =====================================================

ALTER TABLE public.user_model ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_model_select" ON public.user_model;

CREATE POLICY "user_model_select" ON public.user_model
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT/UPDATE for client — server (service role) writes this

-- =====================================================
-- STEP 12: UNLOCKS — own only
-- =====================================================

ALTER TABLE public.unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unlocks_select" ON public.unlocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "unlocks_insert" ON public.unlocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "unlocks_update" ON public.unlocks
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 13: NOTIFICATIONS — own only
-- =====================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 14: INVITATIONS — inviter or invitee
-- =====================================================

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select" ON public.invitations
  FOR SELECT USING (
    inviter_id = auth.uid()
    OR invitee_id = auth.uid()
  );

CREATE POLICY "invitations_insert" ON public.invitations
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "invitations_update" ON public.invitations
  FOR UPDATE USING (
    inviter_id = auth.uid()
    OR invitee_id = auth.uid()
  );

-- =====================================================
-- VERIFICATION: List all policies
-- =====================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
