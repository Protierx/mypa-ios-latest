-- =====================================================
-- Migration: Action System Support (PRD 4.7, 4.8)
-- =====================================================

-- Add timezone for briefing scheduling + usage limit computation
-- Required per PRD section 4.1 Daily Briefing Spec
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Add briefing cache per PRD section 4.1
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_cache TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_date DATE;

-- Add premium flag (synced from RevenueCat)
-- Per PRD section 3 Cost & Tier Enforcement
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Composite index for usage counter computation
-- Per PRD rule 13: usage counters computed from event_log, not mutable columns
-- Optimizes: SELECT COUNT(*) FROM user_events
--   WHERE user_id=$1 AND event_type='voice_command' AND created_at >= today
CREATE INDEX IF NOT EXISTS idx_user_events_user_type_created
  ON user_events(user_id, event_type, created_at);
