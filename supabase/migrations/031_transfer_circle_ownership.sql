-- Atomic circle ownership transfer (Step 8)
-- Runs all 3 updates in a single transaction so partial failures are impossible.

CREATE OR REPLACE FUNCTION transfer_circle_ownership(
  p_circle_id UUID,
  p_old_owner_id UUID,
  p_new_owner_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is the current owner
  IF NOT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id
      AND user_id = p_old_owner_id
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only the current owner can transfer ownership';
  END IF;

  -- Verify new owner is a member of the circle
  IF NOT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id
      AND user_id = p_new_owner_id
  ) THEN
    RAISE EXCEPTION 'New owner must be a member of the circle';
  END IF;

  -- Demote old owner to admin
  UPDATE circle_members
  SET role = 'admin'
  WHERE circle_id = p_circle_id AND user_id = p_old_owner_id;

  -- Promote new owner
  UPDATE circle_members
  SET role = 'owner'
  WHERE circle_id = p_circle_id AND user_id = p_new_owner_id;

  -- Update circles table
  UPDATE circles
  SET owner_id = p_new_owner_id
  WHERE id = p_circle_id;
END;
$$;
