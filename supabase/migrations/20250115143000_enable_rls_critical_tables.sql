-- Migration: Enable RLS on Critical Tables (Phase 1)
-- Description: Enable Row Level Security on work_items, timeline_items, and linked_items
--              These tables have RLS policies defined but RLS is not enabled, causing a security vulnerability.
-- Date: 2025-01-15
-- Priority: CRITICAL - These tables contain 71 rows of potentially sensitive data that are currently exposed

-- ============================================================================
-- PHASE 1: Enable RLS on Tables with Existing Policies
-- ============================================================================

-- 1. Enable RLS on work_items (23 rows currently exposed)
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on timeline_items (31 rows currently exposed)
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on linked_items (17 rows currently exposed)
ALTER TABLE linked_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
--   AND tablename IN ('work_items', 'timeline_items', 'linked_items');
-- Expected: rowsecurity = true for all three tables

-- Verify existing policies are active:
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('work_items', 'timeline_items', 'linked_items')
-- ORDER BY tablename, policyname;
-- Expected: Should see policies for SELECT, INSERT, UPDATE, DELETE for team members

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration (not recommended unless critical issue):
-- ALTER TABLE work_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE timeline_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE linked_items DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- IMPACT ANALYSIS
-- ============================================================================

-- BEFORE: All data in these tables is publicly accessible via PostgREST API
-- AFTER: Only team members can access their team's data (enforced by existing policies)
-- RISK: Low - policies already exist and have been tested
-- BREAKING CHANGES: None - application should continue to work normally as policies are already in place
