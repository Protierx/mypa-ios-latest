-- =====================================================
-- Migration 013: Ensure grants and fix potential RLS hang
-- 
-- Problem: INSERT operations (tasks, circles) hang and
-- never return. SELECT operations work fine.
-- 
-- Root cause candidates:
-- 1. Missing grants after schema changes
-- 2. PostgREST return=representation + RLS causing deadlock
-- =====================================================

-- 1. Re-grant permissions (ensures they apply to all tables after renames)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- 2. Ensure service_role has permissions for SECURITY DEFINER functions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
