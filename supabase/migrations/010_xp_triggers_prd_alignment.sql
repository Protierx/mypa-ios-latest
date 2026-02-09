-- =====================================================
-- Migration 010: XP trigger values aligned to PRD (GAP-03)
--
-- Updates XP awards to match PRD specification:
--   task_complete = 10, high_priority = 20
--   focus_session = 15, perfect_focus = 25
--   streak multiplier: 3d=1.1x, 7d=1.25x, 14d=1.5x, 30d=2.0x
--   Level formula: level = floor((xp/100)^(2/3)) + 1
--     (derived from PRD: XP_needed = 100 * (level-1)^1.5)
--
-- Playbook: Week 1, Day 1 (GAP-03)
-- =====================================================

-- =====================================================
-- 1. TASK COMPLETION XP (replaces add_xp_on_task_complete)
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_xp_on_task_complete()
RETURNS TRIGGER AS $$
DECLARE
  base_xp INT;
  streak INT;
  multiplier REAL;
  final_xp INT;
  new_total_xp INT;
  new_level INT;
BEGIN
  -- Only when task is being completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- PRD XP values by priority
    base_xp := CASE NEW.priority
      WHEN 'urgent' THEN 20
      WHEN 'high'   THEN 20
      WHEN 'medium' THEN 10
      WHEN 'low'    THEN 10
      ELSE 10
    END;

    -- Get current streak for multiplier
    SELECT streak_current INTO streak
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- PRD streak multiplier tiers
    multiplier := CASE
      WHEN streak >= 30 THEN 2.0
      WHEN streak >= 14 THEN 1.5
      WHEN streak >= 7  THEN 1.25
      WHEN streak >= 3  THEN 1.1
      ELSE 1.0
    END;

    final_xp := ROUND(base_xp * multiplier);

    -- Calculate new total and level
    SELECT xp + final_xp INTO new_total_xp
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- PRD level formula: XP_needed = 100 * (level-1)^1.5
    -- Inverted: level = floor((xp/100)^(2/3)) + 1
    new_level := GREATEST(1, FLOOR(POWER(new_total_xp / 100.0, 2.0/3.0)) + 1);

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

-- =====================================================
-- 2. FOCUS SESSION XP (replaces add_xp_on_focus)
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_xp_on_focus()
RETURNS TRIGGER AS $$
DECLARE
  base_xp INT;
  streak INT;
  multiplier REAL;
  final_xp INT;
  new_total_xp INT;
  new_level INT;
  is_perfect BOOLEAN;
BEGIN
  -- Only when session is being ended (ended_at is set)
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN

    -- Check if user completed the full planned duration
    is_perfect := (NEW.duration_actual IS NOT NULL
                   AND NEW.duration_actual >= NEW.duration_planned);

    -- PRD values: focus_session=15, perfect_focus=25
    IF is_perfect THEN
      base_xp := 25;
    ELSE
      base_xp := 15;
    END IF;

    -- Store xp_earned on the session for reference
    NEW.xp_earned := base_xp;

    -- Get current streak for multiplier
    SELECT streak_current INTO streak
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- PRD streak multiplier tiers
    multiplier := CASE
      WHEN streak >= 30 THEN 2.0
      WHEN streak >= 14 THEN 1.5
      WHEN streak >= 7  THEN 1.25
      WHEN streak >= 3  THEN 1.1
      ELSE 1.0
    END;

    final_xp := ROUND(base_xp * multiplier);

    -- Calculate new total and level
    SELECT xp + final_xp INTO new_total_xp
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- PRD level formula
    new_level := GREATEST(1, FLOOR(POWER(new_total_xp / 100.0, 2.0/3.0)) + 1);

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

-- =====================================================
-- 3. STREAK with XP bonus (enhances update_streak_on_task)
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_streak_on_task()
RETURNS TRIGGER AS $$
DECLARE
  last_activity DATE;
  current_streak INT;
  longest_streak INT;
  streak_xp INT := 0;
  new_total_xp INT;
  new_level INT;
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

      -- PRD streak milestone XP bonuses
      IF current_streak = 7 THEN
        streak_xp := 50;   -- streak_week bonus
      ELSIF current_streak = 30 THEN
        streak_xp := 200;  -- streak_month bonus
      ELSIF current_streak >= 3 THEN
        streak_xp := 5;    -- daily streak bonus (after day 3)
      END IF;
    ELSIF last_activity = CURRENT_DATE THEN
      -- Same day, no change
      NULL;
    ELSE
      -- Streak broken
      current_streak := 1;
    END IF;

    -- Update longest if needed
    IF current_streak > longest_streak THEN
      longest_streak := current_streak;
    END IF;

    -- Update profile (including streak XP bonus if any)
    IF streak_xp > 0 THEN
      SELECT xp + streak_xp INTO new_total_xp
      FROM public.profiles
      WHERE id = NEW.user_id;

      new_level := GREATEST(1, FLOOR(POWER(new_total_xp / 100.0, 2.0/3.0)) + 1);

      UPDATE public.profiles
      SET
        streak_last_activity = NOW(),
        streak_current = current_streak,
        streak_longest = longest_streak,
        xp = new_total_xp,
        level = new_level,
        updated_at = NOW()
      WHERE id = NEW.user_id;
    ELSE
      UPDATE public.profiles
      SET
        streak_last_activity = NOW(),
        streak_current = current_streak,
        streak_longest = longest_streak,
        updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. Recreate triggers (ensure they use updated functions)
-- =====================================================

-- Task XP triggers
DROP TRIGGER IF EXISTS on_task_xp ON public.tasks;
CREATE TRIGGER on_task_xp
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.add_xp_on_task_complete();

DROP TRIGGER IF EXISTS on_task_insert_xp ON public.tasks;
CREATE TRIGGER on_task_insert_xp
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.add_xp_on_task_complete();

-- Focus XP trigger
DROP TRIGGER IF EXISTS on_focus_completed ON public.focus_sessions;
CREATE TRIGGER on_focus_completed
  AFTER UPDATE ON public.focus_sessions
  FOR EACH ROW EXECUTE FUNCTION public.add_xp_on_focus();

-- Streak triggers (unchanged but re-applied to use new function)
DROP TRIGGER IF EXISTS on_task_completed ON public.tasks;
CREATE TRIGGER on_task_completed
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_streak_on_task();

DROP TRIGGER IF EXISTS on_task_created_completed ON public.tasks;
CREATE TRIGGER on_task_created_completed
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.update_streak_on_task();
