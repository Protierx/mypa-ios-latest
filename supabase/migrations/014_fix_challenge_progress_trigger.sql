-- =====================================================
-- FIX: update_challenge_progress() crashes on task completion
--
-- Root cause: The function uses a CASE on challenge_record.type
-- which enters the 'focus_time' branch and accesses NEW.ended_at
-- even when triggered from the tasks table (which has no ended_at).
-- PostgreSQL evaluates the field access and throws error 42703.
--
-- Fix: Check TG_TABLE_NAME first with separate IF/ELSIF paths
-- so table-specific field access only occurs in the correct branch.
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

    -- Branch by TABLE first, then challenge type (avoids cross-table field access)
    IF TG_TABLE_NAME = 'tasks' THEN
      IF challenge_record.type = 'tasks_completed' AND NEW.status = 'completed' THEN
        new_progress := new_progress + 1;
      END IF;

    ELSIF TG_TABLE_NAME = 'focus_sessions' THEN
      IF challenge_record.type = 'focus_time' AND NEW.ended_at IS NOT NULL THEN
        new_progress := new_progress + COALESCE(NEW.duration_actual, 0);
      END IF;
    END IF;

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
