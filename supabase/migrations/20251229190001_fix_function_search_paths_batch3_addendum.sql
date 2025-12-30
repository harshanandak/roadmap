-- ============================================================================
-- Migration: Fix Function Search Path Vulnerabilities (Batch 3 Addendum)
-- Date: 2025-12-29
-- ============================================================================
--
-- HISTORICAL NOTE: This migration exists because batch3 was initially deployed
-- with incorrect function signatures, then batch3 was corrected in the same PR.
-- Supabase doesn't re-run already-applied migrations, so this addendum was
-- needed to apply corrections to the existing database.
--
-- FOR NEW DATABASE SETUPS: batch3 now contains all correct fixes. This addendum
-- will run but is effectively a no-op since the functions are already secured.
--
-- The duplicate ALTER statements below are safe (DO blocks handle already-set
-- search_path) but exist only for the historical database that received batch3
-- before the corrections were made to that file.
-- ============================================================================

-- These duplicate batch3 lines 32 and 69 - safe due to exception handling
DO $$ BEGIN
  ALTER FUNCTION public.search_documents(TEXT, extensions.vector(1536), TEXT, TEXT, INTEGER, FLOAT) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION public.get_next_version(TEXT) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;
