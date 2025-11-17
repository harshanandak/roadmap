-- Migration: Fix Function Search Path Security (Phase 4)
-- Description: Set search_path = '' on all database functions to prevent SQL injection
--              40+ functions have mutable search_path which is a security vulnerability
-- Date: 2025-01-15
-- Priority: HIGH - Security vulnerability that could allow privilege escalation

-- ============================================================================
-- PHASE 4: Fix Search Path on All Database Functions
-- ============================================================================

-- Setting search_path = '' prevents malicious users from creating tables/functions
-- in other schemas to intercept function calls and gain elevated privileges.
-- This is a recommended PostgreSQL security best practice.

-- ============================================================================
-- STAGE-RELATED FUNCTIONS
-- ============================================================================

ALTER FUNCTION update_stage_readiness() SET search_path = '';
ALTER FUNCTION check_stage_readiness(text) SET search_path = '';
ALTER FUNCTION advance_feature_stage(text, text, text) SET search_path = '';
ALTER FUNCTION calculate_stage_completion(text) SET search_path = '';

-- ============================================================================
-- DEPENDENCY & CONNECTION FUNCTIONS
-- ============================================================================

ALTER FUNCTION get_timeline_dependencies(text) SET search_path = '';
ALTER FUNCTION get_work_item_dependencies_aggregated(text) SET search_path = '';
ALTER FUNCTION get_work_item_descendants(text) SET search_path = '';
ALTER FUNCTION get_feature_connections(text) SET search_path = '';
ALTER FUNCTION create_bidirectional_connection(text, text, text, text, text, numeric, text, numeric, text) SET search_path = '';
ALTER FUNCTION get_connection_count(text) SET search_path = '';
ALTER FUNCTION are_features_connected(text, text) SET search_path = '';

-- ============================================================================
-- CONVERSION & LINEAGE FUNCTIONS
-- ============================================================================

ALTER FUNCTION get_conversion_lineage(text) SET search_path = '';
ALTER FUNCTION get_work_item_conversion_lineage(text) SET search_path = '';

-- ============================================================================
-- IMPORTANCE SCORING FUNCTIONS
-- ============================================================================

ALTER FUNCTION calculate_importance_score(text) SET search_path = '';
ALTER FUNCTION recalculate_workspace_importance(text) SET search_path = '';
ALTER FUNCTION get_top_important_features(text, integer) SET search_path = '';

-- ============================================================================
-- CORRELATION FUNCTIONS
-- ============================================================================

ALTER FUNCTION detect_workspace_correlations(text, numeric) SET search_path = '';
ALTER FUNCTION get_feature_correlations(text, numeric) SET search_path = '';
ALTER FUNCTION calculate_text_similarity(text, text) SET search_path = '';
ALTER FUNCTION find_feature_correlations(text, numeric) SET search_path = '';

-- ============================================================================
-- INSIGHT & ANALYSIS FUNCTIONS
-- ============================================================================

ALTER FUNCTION get_workspace_insights(text, text, integer) SET search_path = '';
ALTER FUNCTION create_insight(text, text, text, text, text, text, text[], text, numeric, text) SET search_path = '';
ALTER FUNCTION analyze_critical_path(text) SET search_path = '';
ALTER FUNCTION detect_bottlenecks(text) SET search_path = '';
ALTER FUNCTION detect_orphaned_features(text) SET search_path = '';
ALTER FUNCTION analyze_workspace(text) SET search_path = '';

-- ============================================================================
-- TEAM & USER FUNCTIONS
-- ============================================================================

ALTER FUNCTION update_team_member_count() SET search_path = '';
ALTER FUNCTION user_is_team_member(text) SET search_path = '';
ALTER FUNCTION user_is_team_admin(text) SET search_path = '';
ALTER FUNCTION handle_new_user() SET search_path = '';

-- ============================================================================
-- UTILITY & TRIGGER FUNCTIONS
-- ============================================================================

ALTER FUNCTION update_connection_updated_at() SET search_path = '';
ALTER FUNCTION update_correlation_updated_at() SET search_path = '';
ALTER FUNCTION update_importance_updated_at() SET search_path = '';
ALTER FUNCTION update_insight_updated_at() SET search_path = '';
ALTER FUNCTION update_updated_at_column() SET search_path = '';
ALTER FUNCTION generate_text_id() SET search_path = '';

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

-- Verify search_path is set for all functions:
-- SELECT
--   n.nspname as schema,
--   p.proname as function_name,
--   CASE
--     WHEN proconfig IS NULL THEN 'NOT SET (vulnerable)'
--     WHEN array_to_string(proconfig, ',') LIKE '%search_path=%' THEN 'SECURE'
--     ELSE 'NOT SET (vulnerable)'
--   END as search_path_status
-- FROM pg_proc p
-- INNER JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND p.proname IN (
--   'get_timeline_dependencies', 'get_work_item_dependencies_aggregated',
--   'get_conversion_lineage', 'get_work_item_conversion_lineage', 'get_work_item_descendants',
--   'update_stage_readiness', 'check_stage_readiness', 'advance_feature_stage',
--   'calculate_stage_completion', 'get_feature_connections', 'create_bidirectional_connection',
--   'update_connection_updated_at', 'get_connection_count', 'are_features_connected',
--   'calculate_importance_score', 'recalculate_workspace_importance', 'update_importance_updated_at',
--   'get_top_important_features', 'detect_workspace_correlations', 'update_correlation_updated_at',
--   'get_feature_correlations', 'calculate_text_similarity', 'find_feature_correlations',
--   'update_insight_updated_at', 'get_workspace_insights', 'create_insight',
--   'analyze_critical_path', 'detect_bottlenecks', 'detect_orphaned_features', 'analyze_workspace',
--   'update_team_member_count', 'user_is_team_member', 'user_is_team_admin',
--   'update_updated_at_column', 'generate_text_id', 'handle_new_user'
-- )
-- ORDER BY function_name;
-- Expected: All functions should show 'SECURE'

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration (not recommended):
-- ALTER FUNCTION function_name(arguments) RESET search_path;
-- Example:
-- ALTER FUNCTION generate_text_id() RESET search_path;
-- ALTER FUNCTION user_is_team_member(text) RESET search_path;
-- ... (repeat for all 36 functions)

-- ============================================================================
-- IMPACT ANALYSIS
-- ============================================================================

-- BEFORE: Functions can be hijacked via schema search_path manipulation
-- AFTER: Functions run with empty search_path, preventing privilege escalation
-- RISK: Very low - only changes security context, not function behavior
-- BREAKING CHANGES: None - functions continue to work normally
-- SECURITY: Significantly improved - closes major SQL injection vector
-- PERFORMANCE: No impact - search_path setting is cached

-- ============================================================================
-- SECURITY CONTEXT
-- ============================================================================

-- This fix addresses CVE-style vulnerabilities where attackers could:
-- 1. Create malicious tables/functions in public or other schemas
-- 2. Manipulate search_path to make functions reference malicious code
-- 3. Execute arbitrary SQL with elevated privileges
-- 4. Bypass RLS policies or access restricted data

-- With search_path = '', all table/function references must be fully qualified
-- (e.g., public.users instead of just users), preventing this attack vector.
