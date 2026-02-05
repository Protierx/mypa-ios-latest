-- =====================================================
-- MYPA Database Triggers
-- Run this in Supabase Dashboard -> SQL Editor
-- =====================================================

-- =====================================================
-- 1. AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    display_name, 
    username,
    xp,
    level,
    streak_current,
    streak_longest,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(NEW.id::text, 1, 4),
    0,
    1,
    0,
    0,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. UPDATE STREAK ON TASK COMPLETION
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_streak_on_task()
RETURNS TRIGGER AS $$
DECLARE
  last_activity DATE;
  current_streak INT;
  longest_streak INT;
BEGIN
  -- Only run when task is being completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get current profile data
    SELECT 
      streak_last_activity::date,
      streak_current,
      streak_longest
    INTO last_activity, current_streak, longest_streak
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Calculate new streak
    IF last_activity IS NULL OR last_activity < CURRENT_DATE - INTERVAL '1 day' THEN
      -- Streak broken, start fresh
      current_streak := 1;
    ELSIF last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Consecutive day, increment
      current_streak := current_streak + 1;
    ELSIF last_activity = CURRENT_DATE THEN
      -- Same day, no change to streak
      NULL;
    ELSE
      -- Streak broken
      current_streak := 1;
    END IF;
    
    -- Update longest if needed
    IF current_streak > longest_streak THEN
      longest_streak := current_streak;
    END IF;
    
    -- Update profile
    UPDATE public.profiles
    SET 
      streak_last_activity = NOW(),
      streak_current = current_streak,
      streak_longest = longest_streak,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_task_completed ON public.tasks;

-- Create trigger
CREATE TRIGGER on_task_completed
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_streak_on_task();

-- Also trigger on insert if task is created as completed
CREATE TRIGGER on_task_created_completed
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.update_streak_on_task();

-- =====================================================
-- 3. ADD XP ON FOCUS SESSION COMPLETE
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_xp_on_focus()
RETURNS TRIGGER AS $$
DECLARE
  xp_to_add INT;
  new_total_xp INT;
  new_level INT;
BEGIN
  -- Only when session is being ended (ended_at is set)
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    -- Calculate XP (1 XP per minute, bonus for completing full duration)
    xp_to_add := COALESCE(NEW.xp_earned, GREATEST(1, NEW.duration_actual));
    
    -- Get current XP and calculate new level
    SELECT xp + xp_to_add INTO new_total_xp
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Level formula: level = floor(sqrt(xp / 100)) + 1
    new_level := FLOOR(SQRT(new_total_xp / 100.0)) + 1;
    
    -- Update profile
    UPDATE public.profiles
    SET 
      xp = new_total_xp,
      level = new_level,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_focus_completed ON public.focus_sessions;

-- Create trigger
CREATE TRIGGER on_focus_completed
  AFTER UPDATE ON public.focus_sessions
  FOR EACH ROW EXECUTE FUNCTION public.add_xp_on_focus();

-- =====================================================
-- 4. ADD XP ON TASK COMPLETION
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_xp_on_task_complete()
RETURNS TRIGGER AS $$
DECLARE
  xp_to_add INT;
  new_total_xp INT;
  new_level INT;
BEGIN
  -- Only when task is being completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Base XP by priority
    xp_to_add := CASE NEW.priority
      WHEN 'urgent' THEN 15
      WHEN 'high' THEN 10
      WHEN 'medium' THEN 5
      WHEN 'low' THEN 3
      ELSE 5
    END;
    
    -- Get current XP and calculate new level
    SELECT xp + xp_to_add INTO new_total_xp
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Level formula
    new_level := FLOOR(SQRT(new_total_xp / 100.0)) + 1;
    
    -- Update profile
    UPDATE public.profiles
    SET 
      xp = new_total_xp,
      level = new_level,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_task_xp ON public.tasks;

-- Create trigger
CREATE TRIGGER on_task_xp
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.add_xp_on_task_complete();

-- Also for inserts
DROP TRIGGER IF EXISTS on_task_insert_xp ON public.tasks;
CREATE TRIGGER on_task_insert_xp
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.add_xp_on_task_complete();

-- =====================================================
-- 5. UPDATE CHALLENGE PROGRESS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
  challenge_record RECORD;
  new_progress INT;
BEGIN
  -- Loop through user's active challenges
  FOR challenge_record IN 
    SELECT c.id, c.type, c.goal_value, cp.progress
    FROM public.challenges c
    JOIN public.challenge_participants cp ON cp.challenge_id = c.id
    WHERE cp.user_id = NEW.user_id
    AND c.status = 'active'
    AND c.ends_at > NOW()
  LOOP
    new_progress := challenge_record.progress;
    
    -- Update based on challenge type
    CASE challenge_record.type
      WHEN 'tasks_completed' THEN
        IF TG_TABLE_NAME = 'tasks' AND NEW.status = 'completed' THEN
          new_progress := new_progress + 1;
        END IF;
      WHEN 'focus_time' THEN
        IF TG_TABLE_NAME = 'focus_sessions' AND NEW.ended_at IS NOT NULL THEN
          new_progress := new_progress + COALESCE(NEW.duration_actual, 0);
        END IF;
      WHEN 'daily_checkin' THEN
        -- Handled separately
        NULL;
      ELSE
        NULL;
    END CASE;
    
    -- Update if changed
    IF new_progress != challenge_record.progress THEN
      UPDATE public.challenge_participants
      SET progress = new_progress
      WHERE challenge_id = challenge_record.id
      AND user_id = NEW.user_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for challenge progress
DROP TRIGGER IF EXISTS task_challenge_progress ON public.tasks;
CREATE TRIGGER task_challenge_progress
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.update_challenge_progress();

DROP TRIGGER IF EXISTS focus_challenge_progress ON public.focus_sessions;
CREATE TRIGGER focus_challenge_progress
  AFTER UPDATE ON public.focus_sessions
  FOR EACH ROW
  WHEN (NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL)
  EXECUTE FUNCTION public.update_challenge_progress();

-- =====================================================
-- 6. UPDATED_AT TRIGGER (for all tables)
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['profiles', 'tasks']) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- =====================================================
-- VERIFICATION: List all triggers
-- =====================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
