-- ════════════════════════════════════════════════════════════════
-- Migration 035 — All members across circles RPC
-- Purpose: Power the "Members" summary tab modal on Circles Home.
--          Returns unique members the user shares circles with,
--          enriched with profile info and shared circle names.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.circles_all_members()
RETURNS TABLE (
  user_id        UUID,
  display_name   TEXT,
  username       TEXT,
  avatar_url     TEXT,
  circle_names   TEXT[],
  circle_count   BIGINT,
  is_self        BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    p.id            AS user_id,
    p.display_name,
    p.username,
    p.avatar_url,
    array_agg(DISTINCT c.name ORDER BY c.name)  AS circle_names,
    count(DISTINCT c.id)                         AS circle_count,
    (p.id = auth.uid())                          AS is_self
  FROM public.circle_members my_cm
  JOIN public.circle_members their_cm
    ON their_cm.circle_id = my_cm.circle_id
  JOIN public.profiles p
    ON p.id = their_cm.user_id
  JOIN public.circles c
    ON c.id = their_cm.circle_id
  WHERE my_cm.user_id = auth.uid()
  GROUP BY p.id, p.display_name, p.username, p.avatar_url
  ORDER BY
    (p.id = auth.uid()) DESC,          -- self first
    p.display_name NULLS LAST,
    p.username NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.circles_all_members() TO authenticated;
