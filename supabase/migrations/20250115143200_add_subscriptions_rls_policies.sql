-- Migration: Add RLS Policies to Subscriptions Table (Phase 3)
-- Description: Add Row Level Security policies to the subscriptions table
--              RLS is already enabled but no policies exist, creating a security gap
-- Date: 2025-01-15
-- Priority: HIGH - Billing data should be protected with proper access control

-- ============================================================================
-- PHASE 3: Add RLS Policies to Subscriptions Table
-- ============================================================================

-- The subscriptions table already has RLS enabled but no policies.
-- This means NO ONE can access it, which is also a problem.
-- We need to add policies to allow proper access.

-- ============================================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

-- Policy: Team members can view their team's subscription
CREATE POLICY "Team members can view team subscription"
ON subscriptions FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Policy: Team owners can create subscriptions
CREATE POLICY "Team owners can create subscription"
ON subscriptions FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Policy: Team owners and admins can update subscription
CREATE POLICY "Team owners and admins can update subscription"
ON subscriptions FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Policy: Team owners can delete subscription
CREATE POLICY "Team owners can delete subscription"
ON subscriptions FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

-- Verify RLS is enabled (should already be true):
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'subscriptions';
-- Expected: rowsecurity = true

-- Verify policies are created:
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename = 'subscriptions'
-- ORDER BY policyname;
-- Expected: 4 policies (SELECT for members, INSERT for owners, UPDATE for owners/admins, DELETE for owners)

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration:
-- DROP POLICY IF EXISTS "Team members can view team subscription" ON subscriptions;
-- DROP POLICY IF EXISTS "Team owners can create subscription" ON subscriptions;
-- DROP POLICY IF EXISTS "Team owners and admins can update subscription" ON subscriptions;
-- DROP POLICY IF EXISTS "Team owners can delete subscription" ON subscriptions;

-- ============================================================================
-- IMPACT ANALYSIS
-- ============================================================================

-- BEFORE: RLS enabled but no policies = no access possible (blocking legitimate use)
-- AFTER: Team members can view, owners can manage billing
-- RISK: Low - policies follow standard team-based access patterns
-- BREAKING CHANGES: None - this enables previously blocked functionality
-- SECURITY: Improved - proper role-based access control for billing data
