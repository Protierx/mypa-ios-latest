-- Circle Privacy Toggles (PRD 4.4)
-- Per-user visibility settings for circle stats sharing.
-- Task titles are NEVER shared — only aggregate counts.

ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS share_task_count BOOLEAN DEFAULT true;
ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS share_focus_minutes BOOLEAN DEFAULT true;
ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS share_streak BOOLEAN DEFAULT true;
