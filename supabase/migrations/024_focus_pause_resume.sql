-- Migration 024: Add focus session pause/resume persistence
-- Task 1.1 from IMPLEMENTATION_PLAN.md

-- Add columns for pause tracking
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS total_paused_ms INTEGER DEFAULT 0;

-- Index for quickly finding active/paused sessions
CREATE INDEX IF NOT EXISTS idx_focus_sessions_active 
  ON focus_sessions (user_id, started_at) 
  WHERE ended_at IS NULL;
