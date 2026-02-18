-- ════════════════════════════════════════════════════════════════
-- Migration 033 — Circles Home RPCs
-- Purpose: Power the Circles "All" tab with efficient aggregated queries
-- ════════════════════════════════════════════════════════════════

-- ── Indexes (idempotent) ──
-- circle_members PK is (circle_id, user_id) — need user_id leading index
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id
  ON public.circle_members (user_id);

-- challenges lookup by circle + status for active-count aggregation
CREATE INDEX IF NOT EXISTS idx_challenges_circle_status
  ON public.challenges (circle_id, status)
  WHERE circle_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════════
-- RPC 1: circles_home_all()
-- Returns every circle the caller belongs to, with per-circle aggregates.
-- SECURITY DEFINER — filters strictly by auth.uid() membership.
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.circles_home_all()
RETURNS TABLE (
  circle_id        UUID,
  circle_name      TEXT,
  circle_emoji     TEXT,
  circle_description TEXT,
  role             TEXT,
  member_count     BIGINT,
  active_challenges_count BIGINT,
  last_activity_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    c.id                AS circle_id,
    c.name              AS circle_name,
    c.emoji             AS circle_emoji,
    c.description       AS circle_description,
    cm.role             AS role,
    -- Member count for this circle
    (
      SELECT count(*)
      FROM public.circle_members cm2
      WHERE cm2.circle_id = c.id
    )                   AS member_count,
    -- Active challenges: status = 'active' AND within date window
    (
      SELECT count(*)
      FROM public.challenges ch
      WHERE ch.circle_id = c.id
        AND ch.status    = 'active'
        AND ch.starts_at <= NOW()
        AND ch.ends_at   >= NOW()
    )                   AS active_challenges_count,
    -- Last activity from circle_posts (NULL if no posts)
    (
      SELECT max(cp.created_at)
      FROM public.circle_posts cp
      WHERE cp.circle_id = c.id
    )                   AS last_activity_at,
    c.created_at
  FROM public.circles c
  JOIN public.circle_members cm
    ON cm.circle_id = c.id
   AND cm.user_id   = auth.uid()
  ORDER BY
    -- Most recently active circles first, fall back to creation date
    COALESCE(
      (SELECT max(cp2.created_at) FROM public.circle_posts cp2 WHERE cp2.circle_id = c.id),
      c.created_at
    ) DESC;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.circles_home_all() TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- RPC 2: circles_home_counts()
-- Returns top-level aggregate counts for the Circles home stat cards.
-- Avoids N+1 by computing everything in a single query.
-- SECURITY DEFINER — filters strictly by auth.uid() membership.
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.circles_home_counts()
RETURNS TABLE (
  circles_count          BIGINT,
  unique_members_count   BIGINT,
  active_challenges_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH user_circles AS (
    SELECT circle_id
    FROM public.circle_members
    WHERE user_id = auth.uid()
  )
  SELECT
    -- Total circles the user belongs to
    (SELECT count(*) FROM user_circles)
      AS circles_count,
    -- Distinct members across ALL the user's circles
    (
      SELECT count(DISTINCT cm2.user_id)
      FROM public.circle_members cm2
      WHERE cm2.circle_id IN (SELECT circle_id FROM user_circles)
    )
      AS unique_members_count,
    -- Active challenges across ALL the user's circles
    (
      SELECT count(*)
      FROM public.challenges ch
      WHERE ch.circle_id IN (SELECT circle_id FROM user_circles)
        AND ch.status    = 'active'
        AND ch.starts_at <= NOW()
        AND ch.ends_at   >= NOW()
    )
      AS active_challenges_count;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.circles_home_counts() TO authenticated;
