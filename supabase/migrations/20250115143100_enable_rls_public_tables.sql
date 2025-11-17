-- Migration: Enable RLS on Additional Public Tables (Phase 2)
-- Description: Enable Row Level Security and create policies for remaining public tables
--              Tables: user_settings, feature_connections, feature_importance_scores,
--                      feature_correlations, connection_insights
-- Date: 2025-01-15
-- Priority: HIGH - These tables are exposed via PostgREST without RLS protection

-- ============================================================================
-- PHASE 2: Enable RLS and Create Policies for Additional Public Tables
-- ============================================================================

-- ============================================================================
-- 1. USER_SETTINGS TABLE
-- ============================================================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own settings
CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
USING (user_id = auth.uid()::text);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Policy: Users can delete their own settings
CREATE POLICY "Users can delete own settings"
ON user_settings FOR DELETE
USING (user_id = auth.uid()::text);

-- ============================================================================
-- 2. FEATURE_CONNECTIONS TABLE
-- ============================================================================

ALTER TABLE feature_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view team feature connections
CREATE POLICY "Team members can view team feature connections"
ON feature_connections FOR SELECT
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can create feature connections
CREATE POLICY "Team members can create feature connections"
ON feature_connections FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can update team feature connections
CREATE POLICY "Team members can update team feature connections"
ON feature_connections FOR UPDATE
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can delete team feature connections
CREATE POLICY "Team members can delete team feature connections"
ON feature_connections FOR DELETE
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 3. FEATURE_IMPORTANCE_SCORES TABLE
-- ============================================================================

ALTER TABLE feature_importance_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view team importance scores
CREATE POLICY "Team members can view team importance scores"
ON feature_importance_scores FOR SELECT
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can create importance scores
CREATE POLICY "Team members can create importance scores"
ON feature_importance_scores FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can update team importance scores
CREATE POLICY "Team members can update team importance scores"
ON feature_importance_scores FOR UPDATE
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can delete team importance scores
CREATE POLICY "Team members can delete team importance scores"
ON feature_importance_scores FOR DELETE
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 4. FEATURE_CORRELATIONS TABLE
-- ============================================================================

ALTER TABLE feature_correlations ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view team correlations
CREATE POLICY "Team members can view team correlations"
ON feature_correlations FOR SELECT
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can create correlations
CREATE POLICY "Team members can create correlations"
ON feature_correlations FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can update team correlations
CREATE POLICY "Team members can update team correlations"
ON feature_correlations FOR UPDATE
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can delete team correlations
CREATE POLICY "Team members can delete team correlations"
ON feature_correlations FOR DELETE
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 5. CONNECTION_INSIGHTS TABLE
-- ============================================================================

ALTER TABLE connection_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view team insights
CREATE POLICY "Team members can view team insights"
ON connection_insights FOR SELECT
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can create insights
CREATE POLICY "Team members can create insights"
ON connection_insights FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can update team insights
CREATE POLICY "Team members can update team insights"
ON connection_insights FOR UPDATE
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Team members can delete team insights
CREATE POLICY "Team members can delete team insights"
ON connection_insights FOR DELETE
USING (
  user_id IN (
    SELECT user_id::text FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
--   AND tablename IN ('user_settings', 'feature_connections', 'feature_importance_scores',
--                     'feature_correlations', 'connection_insights');
-- Expected: rowsecurity = true for all five tables

-- Verify policies are created:
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('user_settings', 'feature_connections', 'feature_importance_scores',
--                     'feature_correlations', 'connection_insights')
-- ORDER BY tablename, policyname;
-- Expected: 4 policies per table (SELECT, INSERT, UPDATE, DELETE)

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration:
-- DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
-- DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
-- DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
-- DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
-- ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Team members can view team feature connections" ON feature_connections;
-- DROP POLICY IF EXISTS "Team members can create feature connections" ON feature_connections;
-- DROP POLICY IF EXISTS "Team members can update team feature connections" ON feature_connections;
-- DROP POLICY IF EXISTS "Team members can delete team feature connections" ON feature_connections;
-- ALTER TABLE feature_connections DISABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Team members can view team importance scores" ON feature_importance_scores;
-- DROP POLICY IF EXISTS "Team members can create importance scores" ON feature_importance_scores;
-- DROP POLICY IF EXISTS "Team members can update team importance scores" ON feature_importance_scores;
-- DROP POLICY IF EXISTS "Team members can delete team importance scores" ON feature_importance_scores;
-- ALTER TABLE feature_importance_scores DISABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Team members can view team correlations" ON feature_correlations;
-- DROP POLICY IF EXISTS "Team members can create correlations" ON feature_correlations;
-- DROP POLICY IF EXISTS "Team members can update team correlations" ON feature_correlations;
-- DROP POLICY IF EXISTS "Team members can delete team correlations" ON feature_correlations;
-- ALTER TABLE feature_correlations DISABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Team members can view team insights" ON connection_insights;
-- DROP POLICY IF EXISTS "Team members can create insights" ON connection_insights;
-- DROP POLICY IF EXISTS "Team members can update team insights" ON connection_insights;
-- DROP POLICY IF EXISTS "Team members can delete team insights" ON connection_insights;
-- ALTER TABLE connection_insights DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- IMPACT ANALYSIS
-- ============================================================================

-- BEFORE: All data in these tables is publicly accessible via PostgREST API
-- AFTER:
--   - user_settings: Only accessible by the owning user
--   - feature_connections: Only accessible by team members
--   - feature_importance_scores: Only accessible by team members
--   - feature_correlations: Only accessible by team members
--   - connection_insights: Only accessible by team members
-- RISK: Medium - New policies need testing to ensure they work correctly
-- BREAKING CHANGES: None expected if application properly uses Supabase auth
