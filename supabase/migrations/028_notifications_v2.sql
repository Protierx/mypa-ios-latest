-- =====================================================
-- 028: Notifications V2 — add category, read_at, deleted_at + indexes
-- =====================================================

-- Add category column (social | tasks | system)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'system';

-- Replace boolean `read` with `read_at` timestamptz
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- Migrate existing data: if read = true, set read_at = created_at
UPDATE public.notifications
  SET read_at = created_at
  WHERE read = TRUE AND read_at IS NULL;

-- Soft-delete support
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_category
  ON public.notifications(user_id, category)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id)
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- RLS policies (update existing to exclude soft-deleted)
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can insert notifications (for edge functions / triggers)
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable RLS if not already
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
