-- =============================================================================
-- Migration: Drop status column from work_items (architecture cleanup)
-- Created: 2025-12-23
--
-- RATIONALE:
-- Work items use 'phase' as their status (phase IS the status).
-- The 'status' column is for timeline_items (task execution tracking).
-- Having both phase and status on work_items violates architecture.
--
-- REFERENCES:
-- - docs/ARCHITECTURE_CONSOLIDATION.md
-- - CLAUDE.md "Phase vs Status Clarification" section
-- =============================================================================

-- =============================================================================
-- STEP 1: Verify data consistency before dropping column
-- =============================================================================
-- Check if there are any work items where status differs from phase
-- (Log for review but don't block migration)
DO $$
DECLARE
  inconsistent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inconsistent_count
  FROM work_items
  WHERE status IS NOT NULL
    AND status != phase;

  IF inconsistent_count > 0 THEN
    RAISE NOTICE 'Found % work items where status differs from phase', inconsistent_count;
    RAISE NOTICE 'These will lose their status value when the column is dropped';
  ELSE
    RAISE NOTICE 'All work items have consistent phase values (or NULL status)';
  END IF;
END $$;

-- =============================================================================
-- STEP 2: Drop the status column from work_items
-- =============================================================================
ALTER TABLE work_items DROP COLUMN IF EXISTS status;

-- =============================================================================
-- STEP 3: Add comment to phase column for clarity
-- =============================================================================
COMMENT ON COLUMN work_items.phase IS
  'Current lifecycle phase of the work item. This IS the status - no separate status field exists. Type-specific phases apply (feature: design/build/refine/launch, bug: triage/investigating/fixing/verified, concept: ideation/research/validated/rejected).';
