-- NUCLEAR OPTION: Drop ALL policies and recreate simple ones

-- Drop ALL existing policies on problematic tables
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
-- SIMPLE NON-RECURSIVE POLICIES
-- =====================================================

-- PROFILES: Simple self-access
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- TASKS: Simple owner access
CREATE POLICY "tasks_all" ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- CIRCLES: Owner or public
CREATE POLICY "circles_select" ON public.circles FOR SELECT USING (true);
CREATE POLICY "circles_insert" ON public.circles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "circles_update" ON public.circles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "circles_delete" ON public.circles FOR DELETE USING (auth.uid() = owner_id);

-- CIRCLE_MEMBERS: Simple access (avoid recursion)
CREATE POLICY "circle_members_select" ON public.circle_members FOR SELECT USING (true);
CREATE POLICY "circle_members_insert" ON public.circle_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "circle_members_delete" ON public.circle_members FOR DELETE USING (auth.uid() = user_id);

-- CHALLENGES: Simple access
CREATE POLICY "challenges_select" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "challenges_insert" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "challenges_update" ON public.challenges FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "challenges_delete" ON public.challenges FOR DELETE USING (auth.uid() = creator_id);

-- CHALLENGE_PARTICIPANTS: Simple access (avoid recursion)
CREATE POLICY "challenge_participants_select" ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY "challenge_participants_insert" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "challenge_participants_update" ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "challenge_participants_delete" ON public.challenge_participants FOR DELETE USING (auth.uid() = user_id);

-- FOCUS_SESSIONS
CREATE POLICY "focus_sessions_all" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);

-- USER_EVENTS
CREATE POLICY "user_events_select" ON public.user_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_events_insert" ON public.user_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER_MODELS
CREATE POLICY "user_models_select" ON public.user_models FOR SELECT USING (auth.uid() = user_id);

-- UNLOCKS
CREATE POLICY "unlocks_select" ON public.unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "unlocks_update" ON public.unlocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "unlocks_insert" ON public.unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Verify
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
