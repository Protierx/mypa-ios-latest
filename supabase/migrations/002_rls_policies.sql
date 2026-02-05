-- =====================================================
-- MYPA Row Level Security (RLS) Policies
-- Run this in Supabase Dashboard -> SQL Editor
-- =====================================================

-- First, ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE
-- =====================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can view other profiles (for circles, challenges)
DROP POLICY IF EXISTS "Users can view circle member profiles" ON public.profiles;
CREATE POLICY "Users can view circle member profiles" ON public.profiles
  FOR SELECT USING (
    id IN (
      SELECT cm.user_id FROM public.circle_members cm
      WHERE cm.circle_id IN (
        SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- TASKS TABLE
-- =====================================================

-- Users can do everything with their own tasks
DROP POLICY IF EXISTS "Users can CRUD own tasks" ON public.tasks;
CREATE POLICY "Users can CRUD own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- Users can view tasks in their circles
DROP POLICY IF EXISTS "Users can view circle tasks" ON public.tasks;
CREATE POLICY "Users can view circle tasks" ON public.tasks
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- CIRCLES TABLE
-- =====================================================

-- Anyone can view public circles
DROP POLICY IF EXISTS "Anyone can view public circles" ON public.circles;
CREATE POLICY "Anyone can view public circles" ON public.circles
  FOR SELECT USING (privacy = 'public');

-- Members can view their circles
DROP POLICY IF EXISTS "Members can view their circles" ON public.circles;
CREATE POLICY "Members can view their circles" ON public.circles
  FOR SELECT USING (
    id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

-- Owners can update their circles
DROP POLICY IF EXISTS "Owners can update circles" ON public.circles;
CREATE POLICY "Owners can update circles" ON public.circles
  FOR UPDATE USING (owner_id = auth.uid());

-- Owners can delete their circles
DROP POLICY IF EXISTS "Owners can delete circles" ON public.circles;
CREATE POLICY "Owners can delete circles" ON public.circles
  FOR DELETE USING (owner_id = auth.uid());

-- Authenticated users can create circles
DROP POLICY IF EXISTS "Auth users can create circles" ON public.circles;
CREATE POLICY "Auth users can create circles" ON public.circles
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- CIRCLE MEMBERS TABLE
-- =====================================================

-- Members can view other members in their circles
DROP POLICY IF EXISTS "Members can view circle members" ON public.circle_members;
CREATE POLICY "Members can view circle members" ON public.circle_members
  FOR SELECT USING (
    circle_id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid())
  );

-- Users can join circles (insert themselves)
DROP POLICY IF EXISTS "Users can join circles" ON public.circle_members;
CREATE POLICY "Users can join circles" ON public.circle_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave circles (delete themselves)
DROP POLICY IF EXISTS "Users can leave circles" ON public.circle_members;
CREATE POLICY "Users can leave circles" ON public.circle_members
  FOR DELETE USING (auth.uid() = user_id);

-- Circle owners/admins can manage members
DROP POLICY IF EXISTS "Admins can manage circle members" ON public.circle_members;
CREATE POLICY "Admins can manage circle members" ON public.circle_members
  FOR ALL USING (
    circle_id IN (
      SELECT id FROM public.circles WHERE owner_id = auth.uid()
    )
    OR circle_id IN (
      SELECT circle_id FROM public.circle_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- CHALLENGES TABLE
-- =====================================================

-- Users can view challenges they're in
DROP POLICY IF EXISTS "Users can view their challenges" ON public.challenges;
CREATE POLICY "Users can view their challenges" ON public.challenges
  FOR SELECT USING (
    creator_id = auth.uid()
    OR id IN (SELECT challenge_id FROM public.challenge_participants WHERE user_id = auth.uid())
    OR circle_id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid())
  );

-- Users can create challenges
DROP POLICY IF EXISTS "Users can create challenges" ON public.challenges;
CREATE POLICY "Users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Creators can update their challenges
DROP POLICY IF EXISTS "Creators can update challenges" ON public.challenges;
CREATE POLICY "Creators can update challenges" ON public.challenges
  FOR UPDATE USING (creator_id = auth.uid());

-- Creators can delete their challenges
DROP POLICY IF EXISTS "Creators can delete challenges" ON public.challenges;
CREATE POLICY "Creators can delete challenges" ON public.challenges
  FOR DELETE USING (creator_id = auth.uid());

-- =====================================================
-- CHALLENGE PARTICIPANTS TABLE
-- =====================================================

-- Users can view participants in their challenges
DROP POLICY IF EXISTS "Users can view challenge participants" ON public.challenge_participants;
CREATE POLICY "Users can view challenge participants" ON public.challenge_participants
  FOR SELECT USING (
    challenge_id IN (
      SELECT challenge_id FROM public.challenge_participants WHERE user_id = auth.uid()
    )
    OR challenge_id IN (
      SELECT id FROM public.challenges WHERE creator_id = auth.uid()
    )
  );

-- Users can join challenges
DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
CREATE POLICY "Users can join challenges" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
DROP POLICY IF EXISTS "Users can update own progress" ON public.challenge_participants;
CREATE POLICY "Users can update own progress" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can leave challenges
DROP POLICY IF EXISTS "Users can leave challenges" ON public.challenge_participants;
CREATE POLICY "Users can leave challenges" ON public.challenge_participants
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FOCUS SESSIONS TABLE
-- =====================================================

-- Users can manage their own focus sessions
DROP POLICY IF EXISTS "Users can CRUD own sessions" ON public.focus_sessions;
CREATE POLICY "Users can CRUD own sessions" ON public.focus_sessions
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- USER EVENTS TABLE
-- =====================================================

-- Users can insert their own events
DROP POLICY IF EXISTS "Users can insert own events" ON public.user_events;
CREATE POLICY "Users can insert own events" ON public.user_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own events
DROP POLICY IF EXISTS "Users can view own events" ON public.user_events;
CREATE POLICY "Users can view own events" ON public.user_events
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- USER MODELS TABLE
-- =====================================================

-- Users can view their own model
DROP POLICY IF EXISTS "Users can view own model" ON public.user_models;
CREATE POLICY "Users can view own model" ON public.user_models
  FOR SELECT USING (auth.uid() = user_id);

-- System can update (via service role, not needed in RLS)

-- =====================================================
-- UNLOCKS TABLE
-- =====================================================

-- Users can view their own unlocks
DROP POLICY IF EXISTS "Users can view own unlocks" ON public.unlocks;
CREATE POLICY "Users can view own unlocks" ON public.unlocks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update seen status
DROP POLICY IF EXISTS "Users can update own unlocks" ON public.unlocks;
CREATE POLICY "Users can update own unlocks" ON public.unlocks
  FOR UPDATE USING (auth.uid() = user_id);

-- System inserts unlocks (via service role)
DROP POLICY IF EXISTS "System can insert unlocks" ON public.unlocks;
CREATE POLICY "System can insert unlocks" ON public.unlocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

-- Users can manage their own notifications
DROP POLICY IF EXISTS "Users can CRUD own notifications" ON public.notifications;
CREATE POLICY "Users can CRUD own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION: List all policies
-- =====================================================
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
