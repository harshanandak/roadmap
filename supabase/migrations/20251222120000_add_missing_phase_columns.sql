-- =============================================================================
-- Migration: Add missing phase and versioning columns to work_items
-- Created: 2025-12-22
--
-- This migration adds columns that were supposed to be added by previous
-- migrations but were marked as applied without actually running.
-- =============================================================================

-- =============================================================================
-- STEP 0: Disable USER triggers on work_items during migration
-- =============================================================================
ALTER TABLE work_items DISABLE TRIGGER USER;

-- =============================================================================
-- STEP 1: Add phase column to work_items (from comprehensive_phase_system)
-- =============================================================================
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS phase TEXT;

-- Set default value for existing records (triggers disabled)
-- Only update NULL values to protect existing valid data
UPDATE work_items
SET phase = CASE type
  WHEN 'feature' THEN 'design'
  WHEN 'enhancement' THEN 'design'
  WHEN 'concept' THEN 'ideation'
  WHEN 'bug' THEN 'triage'
  ELSE 'design'
END
WHERE phase IS NULL;

-- =============================================================================
-- STEP 2: Add type-aware phase constraint (from add_type_specific_phases)
-- =============================================================================
-- Drop any existing constraint first
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_phase_check;

-- Add type-aware CHECK constraint
ALTER TABLE work_items ADD CONSTRAINT work_items_phase_check CHECK (
  -- Feature phases
  (type = 'feature' AND phase IN ('design', 'build', 'refine', 'launch'))
  OR
  -- Concept phases
  (type = 'concept' AND phase IN ('ideation', 'research', 'validated', 'rejected'))
  OR
  -- Bug phases
  (type = 'bug' AND phase IN ('triage', 'investigating', 'fixing', 'verified'))
  OR
  -- Enhancement phases (same as Feature)
  (type = 'enhancement' AND phase IN ('design', 'build', 'refine', 'launch'))
  OR
  -- Allow NULL phase temporarily during creation
  (phase IS NULL)
);

-- =============================================================================
-- STEP 3: Add versioning columns (from add_type_specific_phases)
-- =============================================================================
-- enhances_work_item_id: Links this item to the parent it enhances
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS enhances_work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL;

-- version: Auto-incremented version number (1, 2, 3...)
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- version_notes: Changelog/release notes for this version
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS version_notes TEXT;

-- =============================================================================
-- STEP 4: Add review configuration columns (from add_type_specific_phases)
-- =============================================================================
-- review_enabled: Per-item toggle for review process
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS review_enabled BOOLEAN DEFAULT true;

-- review_status: Current review state
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS review_status TEXT;

-- Add CHECK constraint for review_status values
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_review_status_check;
ALTER TABLE work_items ADD CONSTRAINT work_items_review_status_check
  CHECK (review_status IS NULL OR review_status IN ('pending', 'approved', 'needs_revision', 'rejected'));

-- =============================================================================
-- STEP 5: Create indexes for new columns
-- =============================================================================
-- Index for finding all enhancements of a work item
CREATE INDEX IF NOT EXISTS idx_work_items_enhances
  ON work_items(enhances_work_item_id)
  WHERE enhances_work_item_id IS NOT NULL;

-- Composite index for type-phase queries (common in UI filtering)
CREATE INDEX IF NOT EXISTS idx_work_items_type_phase
  ON work_items(type, phase);

-- Index for review status filtering
CREATE INDEX IF NOT EXISTS idx_work_items_review_status
  ON work_items(review_status)
  WHERE review_status IS NOT NULL;

-- =============================================================================
-- STEP 6: Set default review_enabled based on type
-- =============================================================================
-- Bugs default to review disabled (optional review)
UPDATE work_items
SET review_enabled = false
WHERE type = 'bug' AND review_enabled IS NULL;

-- All other types default to review enabled
UPDATE work_items
SET review_enabled = true
WHERE type != 'bug' AND review_enabled IS NULL;

-- =============================================================================
-- STEP 7: Create helper function for getting next version number
-- =============================================================================
CREATE OR REPLACE FUNCTION get_next_version(parent_id TEXT, p_team_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO max_version
  FROM work_items
  WHERE team_id = p_team_id
    AND (enhances_work_item_id = parent_id OR id = parent_id);

  RETURN max_version + 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 8: Add comment documentation
-- =============================================================================
COMMENT ON COLUMN work_items.phase IS
  'Current lifecycle phase of the work item. Type-specific phases apply.';

COMMENT ON COLUMN work_items.enhances_work_item_id IS
  'Links this work item to a parent work item it enhances. Used for versioning/enhancement tracking.';

COMMENT ON COLUMN work_items.version IS
  'Version number in the enhancement chain. Auto-incremented when creating enhancements.';

COMMENT ON COLUMN work_items.version_notes IS
  'Changelog or release notes describing what changed in this version.';

COMMENT ON COLUMN work_items.review_enabled IS
  'Whether the detached review process is enabled for this item. Defaults to true for features/concepts, false for bugs.';

COMMENT ON COLUMN work_items.review_status IS
  'Current status of the review process: pending, approved, needs_revision, or rejected.';

-- =============================================================================
-- STEP 9: Re-enable triggers
-- =============================================================================
ALTER TABLE work_items ENABLE TRIGGER USER;
