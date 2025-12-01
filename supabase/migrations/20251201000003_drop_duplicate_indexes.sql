-- Migration: Drop duplicate indexes for performance
-- Issue: Supabase advisor detected 5 duplicate_index warnings
-- Fix: Drop redundant indexes (keeping the ones with better naming conventions)
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index

-- ============================================================================
-- TABLE: linked_items
-- Duplicate: idx_linked_items_workspace and idx_linked_items_workspace_id
-- Keep: idx_linked_items_workspace_id (more descriptive)
-- ============================================================================
DROP INDEX IF EXISTS idx_linked_items_workspace;

-- ============================================================================
-- TABLE: work_item_connections
-- These duplicates are from a table rename (feature_connections → work_item_connections)
-- Keep: idx_work_item_connections_* (matches current table name)
-- Drop: idx_connections_* (legacy naming)
-- ============================================================================
DROP INDEX IF EXISTS idx_connections_type;
DROP INDEX IF EXISTS idx_connections_source;
DROP INDEX IF EXISTS idx_connections_target;
DROP INDEX IF EXISTS idx_connections_workspace;
