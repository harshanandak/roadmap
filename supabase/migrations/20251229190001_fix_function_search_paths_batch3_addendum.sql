-- ============================================================================
-- Migration: Fix Function Search Path Vulnerabilities (Batch 3 Addendum)
-- Date: 2025-12-29
-- Purpose: Fix two issues missed in batch3 migration:
--          1. search_documents needs exact vector(1536) type signature
--          2. get_next_version(TEXT) single-param version was missed
-- ============================================================================

-- ============================================================================
-- FIX 1: search_documents with correct vector(1536) signature
-- ============================================================================
-- The original batch3 migration used extensions.vector instead of extensions.vector(1536)
-- PostgreSQL requires exact type match for ALTER FUNCTION

DO $$ BEGIN
  ALTER FUNCTION public.search_documents(TEXT, extensions.vector(1536), TEXT, TEXT, INTEGER, FLOAT) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================================================
-- FIX 2: get_next_version(TEXT) - single parameter version
-- ============================================================================
-- The original batch3 migration only fixed get_next_version(TEXT, TEXT)
-- This fixes the single-param version from 20251216190751_add_type_specific_phases.sql

DO $$ BEGIN
  ALTER FUNCTION public.get_next_version(TEXT) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all functions are now secured:
--
-- SELECT
--   p.proname as function_name,
--   pg_get_function_identity_arguments(p.oid) as signature,
--   CASE
--     WHEN proconfig IS NULL THEN 'VULNERABLE'
--     WHEN array_to_string(proconfig, ',') LIKE '%search_path=%' THEN 'SECURE'
--     ELSE 'VULNERABLE'
--   END as status
-- FROM pg_proc p
-- INNER JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname IN (
--     'get_knowledge_base_stats', 'search_documents', 'update_knowledge_updated_at',
--     'get_team_integration_summary', 'update_integration_updated_at',
--     'reorder_strategy_siblings', 'get_next_version'
--   )
-- ORDER BY function_name, signature;
-- Expected: All functions show 'SECURE'
