-- ════════════════════════════════════════════════════════════════
-- Migration 034 — New Posts feature
-- Purpose: Track per-user per-circle "last seen" timestamp to power
--          the "New Posts" filter chip on Circles Home.
-- ════════════════════════════════════════════════════════════════

-- ── Table: circle_last_seen ──
-- Tracks when each user last viewed each circle's feed.
CREATE TABLE IF NOT EXISTS public.circle_last_seen (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id     UUID        NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (circle_id, user_id)
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_circle_last_seen_user
  ON public.circle_last_seen (user_id);
CREATE INDEX IF NOT EXISTS idx_circle_last_seen_circle
  ON public.circle_last_seen (circle_id);

-- ── RLS ──
ALTER TABLE public.circle_last_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own last_seen"
  ON public.circle_last_seen FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own last_seen"
  ON public.circle_last_seen FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_circle_member(circle_id, auth.uid())
  );

CREATE POLICY "Users can update own last_seen"
  ON public.circle_last_seen FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own last_seen"
  ON public.circle_last_seen FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON public.circle_last_seen TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- RPC: circles_with_new_posts()
-- Returns circles the user belongs to that have unread posts.
-- "Unread" = circle_posts.created_at > circle_last_seen.last_seen_at
-- If no last_seen row exists, ALL posts are considered new.
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.circles_with_new_posts()
RETURNS TABLE (
  circle_id       UUID,
  circle_name     TEXT,
  circle_emoji    TEXT,
  new_posts_count BIGINT,
  last_post_at    TIMESTAMPTZ,
  last_seen_at    TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    c.id            AS circle_id,
    c.name          AS circle_name,
    c.emoji         AS circle_emoji,
    count(cp.id)    AS new_posts_count,
    max(cp.created_at) AS last_post_at,
    cls.last_seen_at
  FROM public.circles c
  JOIN public.circle_members cm
    ON cm.circle_id = c.id
   AND cm.user_id   = auth.uid()
  JOIN public.circle_posts cp
    ON cp.circle_id = c.id
   AND cp.created_at > COALESCE(
         (SELECT cls2.last_seen_at
          FROM public.circle_last_seen cls2
          WHERE cls2.circle_id = c.id
            AND cls2.user_id   = auth.uid()),
         '1970-01-01T00:00:00Z'::timestamptz
       )
  LEFT JOIN public.circle_last_seen cls
    ON cls.circle_id = c.id
   AND cls.user_id   = auth.uid()
  GROUP BY c.id, c.name, c.emoji, cls.last_seen_at
  HAVING count(cp.id) > 0
  ORDER BY max(cp.created_at) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.circles_with_new_posts() TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- RPC: mark_circle_seen(p_circle_id uuid)
-- Upserts the user's last_seen_at for a given circle to NOW().
-- Returns the upserted row.
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.mark_circle_seen(p_circle_id UUID)
RETURNS SETOF public.circle_last_seen
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is a member
  IF NOT public.is_circle_member(p_circle_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this circle';
  END IF;

  RETURN QUERY
  INSERT INTO public.circle_last_seen (circle_id, user_id, last_seen_at)
  VALUES (p_circle_id, auth.uid(), NOW())
  ON CONFLICT (circle_id, user_id)
  DO UPDATE SET last_seen_at = NOW()
  RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_circle_seen(UUID) TO authenticated;
