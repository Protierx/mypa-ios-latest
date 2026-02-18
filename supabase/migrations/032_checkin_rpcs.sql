-- =====================================================
-- CIRCLE CHECK-IN RPCS + MISSING POLICIES
-- Backend for "Needs Check-In" feature
-- =====================================================
-- Existing tables used:
--   circle_checkins (022), circles (001), circle_members (001), profiles (001)
-- Existing helper: is_circle_member(uuid, uuid) (011)
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1) Add missing DELETE policy on circle_checkins
-- ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete own checkins" ON public.circle_checkins;
CREATE POLICY "Users can delete own checkins"
  ON public.circle_checkins FOR DELETE
  USING (
    auth.uid() = user_id
    AND public.is_circle_member(circle_id, auth.uid())
  );

-- ─────────────────────────────────────────────────────
-- 2) RPC: circles_needing_checkin(p_local_date date)
--    Returns circles the caller has NOT checked into
--    for the given local date.
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.circles_needing_checkin(p_local_date DATE)
RETURNS TABLE (
  circle_id     UUID,
  circle_name   TEXT,
  circle_emoji  TEXT,
  member_count  BIGINT,
  checked_in_count BIGINT,
  has_checked_in BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    c.id                            AS circle_id,
    c.name                          AS circle_name,
    COALESCE(c.emoji, '👥')        AS circle_emoji,
    -- total members in this circle
    (SELECT COUNT(*) FROM public.circle_members cm2
     WHERE cm2.circle_id = c.id)    AS member_count,
    -- how many members checked in today
    (SELECT COUNT(*) FROM public.circle_checkins ck2
     WHERE ck2.circle_id = c.id
       AND ck2.date = p_local_date) AS checked_in_count,
    FALSE                           AS has_checked_in
  FROM public.circles c
  INNER JOIN public.circle_members cm
    ON cm.circle_id = c.id AND cm.user_id = auth.uid()
  LEFT JOIN public.circle_checkins ck
    ON ck.circle_id = c.id
   AND ck.user_id = auth.uid()
   AND ck.date = p_local_date
  WHERE ck.id IS NULL   -- user has NOT checked in
  ORDER BY c.name;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.circles_needing_checkin(DATE) TO authenticated;

-- ─────────────────────────────────────────────────────
-- 3) RPC: submit_circle_checkin(...)
--    Upserts a check-in for the calling user.
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_circle_checkin(
  p_circle_id  UUID,
  p_local_date DATE,
  p_note       TEXT DEFAULT NULL
)
RETURNS SETOF public.circle_checkins
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify membership
  IF NOT public.is_circle_member(p_circle_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this circle';
  END IF;

  RETURN QUERY
  INSERT INTO public.circle_checkins (
    circle_id, user_id, date, intention_text
  ) VALUES (
    p_circle_id,
    auth.uid(),
    p_local_date,
    COALESCE(p_note, '')
  )
  ON CONFLICT (circle_id, user_id, date)
  DO UPDATE SET
    intention_text = COALESCE(EXCLUDED.intention_text, circle_checkins.intention_text),
    created_at     = NOW()       -- bump timestamp on re-submit
  RETURNING *;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_circle_checkin(UUID, DATE, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────
-- 4) RPC: circle_checkins_for_date(p_circle_id, p_local_date)
--    Returns all check-ins for a circle on a given date
--    joined with profile info.
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.circle_checkins_for_date(
  p_circle_id  UUID,
  p_local_date DATE
)
RETURNS TABLE (
  checkin_id    UUID,
  user_id       UUID,
  display_name  TEXT,
  avatar_url    TEXT,
  intention     TEXT,
  note          TEXT,
  created_at    TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    ck.id              AS checkin_id,
    ck.user_id         AS user_id,
    COALESCE(p.display_name, p.username, 'Member') AS display_name,
    p.avatar_url       AS avatar_url,
    ck.intention_text  AS intention,
    ck.intention_text  AS note,       -- alias for convenience
    ck.created_at      AS created_at
  FROM public.circle_checkins ck
  INNER JOIN public.profiles p ON p.id = ck.user_id
  WHERE ck.circle_id = p_circle_id
    AND ck.date = p_local_date
    -- Security: caller must be a member of this circle
    AND public.is_circle_member(p_circle_id, auth.uid())
  ORDER BY ck.created_at ASC;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.circle_checkins_for_date(UUID, DATE) TO authenticated;
