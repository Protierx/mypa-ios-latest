-- Add task_mode column to distinguish focus tasks from quick checkbox tasks.
-- "focus" = deep work needing a timer, "quick" = simple checkbox.
-- Default to 'quick' for existing tasks (backwards compatible).

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS task_mode TEXT DEFAULT 'quick'
    CHECK (task_mode IN ('quick', 'focus'));

-- Index for filtering by mode
CREATE INDEX IF NOT EXISTS idx_tasks_mode ON public.tasks (user_id, task_mode)
  WHERE status = 'pending';
