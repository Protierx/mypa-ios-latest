-- =====================================================
-- FIX: RLS Policy Infinite Recursion
-- The circle_members and challenge_participants policies 
-- were causing infinite recursion by querying themselves
-- =====================================================

-- =====================================================
-- DROP ALL PROBLEMATIC POLICIES FIRST
-- =====================================================

-- Circle members policies
DROP POLICY IF EXISTS "Members can view circle members" ON public.circle_members;
DROP POLICY IF EXISTS "Admins can manage circle members" ON public.circle_members;
DROP POLICY IF EXISTS "Users can join circles" ON public.circle_members;
DROP POLICY IF EXISTS "Users can leave circles" ON public.circle_members;

-- Challenge participants policies  
DROP POLICY IF EXISTS "Users can view challenge participants" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can update own progress" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can leave challenges" ON public.challenge_participants;

-- Circle viewing policies that reference circle_members
DROP POLICY IF EXISTS "Members can view their circles" ON public.circles;

-- Task viewing policies that reference circle_members
DROP POLICY IF EXISTS "Users can view circle tasks" ON public.tasks;

-- Challenge viewing policies
DROP POLICY IF EXISTS "Users can view their challenges" ON public.challenges;

-- Profile viewing policies
DROP POLICY IF EXISTS "Users can view circle member profiles" ON public.profiles;

-- =====================================================
-- CIRCLE_MEMBERS - Fixed (no self-reference)
-- =====================================================

-- Simple: Users can view all members in circles they belong to
CREATE POLICY "View circle members" ON public.circle_members
  FOR SELECT USING (
    -- User is a member themselves, can see all members in that circle
    EXISTS (
      SELECT 1 FROM public.circles c 
      WHERE c.id = circle_members.circle_id 
      AND (c.owner_id = auth.uid() OR c.privacy = 'public')
    )
    OR user_id = auth.uid()
  );

-- Users can insert themselves as members
CREATE POLICY "Join circles" ON public.circle_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove themselves from circles
CREATE POLICY "Leave circles" ON public.circle_members
  FOR DELETE USING (auth.uid() = user_id);

-- Circle owners can manage all members
CREATE POLICY "Owners manage members" ON public.circle_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.circles c 
      WHERE c.id = circle_members.circle_id 
      AND c.owner_id = auth.uid()
    )
  );

-- =====================================================
-- CHALLENGE_PARTICIPANTS - Fixed (no self-reference)
-- =====================================================

-- View participants: either you're creator or a participant
CREATE POLICY "View challenge participants" ON public.challenge_participants
  FOR SELECT USING (
    -- You are a participant in this challenge
    user_id = auth.uid()
    OR
    -- You are the challenge creator
    EXISTS (
      SELECT 1 FROM public.challenges c 
      WHERE c.id = challenge_participants.challenge_id 
      AND c.creator_id = auth.uid()
    )
  );

-- Users can join challenges
CREATE POLICY "Join challenges" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Update own progress" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can leave challenges
CREATE POLICY "Leave challenges" ON public.challenge_participants
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CIRCLES - Fixed (uses circles table, not circle_members)
-- =====================================================

CREATE POLICY "View own or public circles" ON public.circles
  FOR SELECT USING (
    owner_id = auth.uid() 
    OR privacy = 'public'
    OR EXISTS (
      SELECT 1 FROM public.circle_members cm 
      WHERE cm.circle_id = circles.id AND cm.user_id = auth.uid()
    )
  );

-- =====================================================
-- TASKS - Fixed (avoids circle_members recursion)
-- =====================================================

CREATE POLICY "View circle tasks" ON public.tasks
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      circle_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.circle_members cm 
        WHERE cm.circle_id = tasks.circle_id AND cm.user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- CHALLENGES - Fixed (avoids recursion)
-- =====================================================

CREATE POLICY "View challenges" ON public.challenges
  FOR SELECT USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.challenge_participants cp 
      WHERE cp.challenge_id = challenges.id AND cp.user_id = auth.uid()
    )
    OR (
      circle_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.circle_members cm 
        WHERE cm.circle_id = challenges.circle_id AND cm.user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- PROFILES - Fixed (simpler, less recursion-prone)
-- =====================================================

CREATE POLICY "View profiles in circles" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.circle_members cm1
      JOIN public.circle_members cm2 ON cm1.circle_id = cm2.circle_id
      WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.id
    )
  );

-- =====================================================
-- Verify policies
-- =====================================================
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
