-- Add missing foreign key constraint from work_items.workspace_id to workspaces.id
-- This enables PostgREST embedded resource queries (using the : syntax in .select())
--
-- Prior to this migration, the work_items table had FK constraints for:
-- - team_id -> teams.id
-- - converted_by -> users.id
-- - flow_id -> work_flows.id
-- - parent_id -> work_items.id (self-reference)
--
-- But was MISSING the FK for workspace_id, which caused PGRST200 errors:
-- "Could not find a relationship between 'work_items' and 'workspace_id' in the schema cache"

-- Step 1: Clean up any orphaned work_items (workspace_id references non-existent workspace)
DELETE FROM timeline_items
WHERE work_item_id IN (
  SELECT wi.id
  FROM work_items wi
  LEFT JOIN workspaces w ON wi.workspace_id = w.id
  WHERE w.id IS NULL
);

DELETE FROM work_items
WHERE workspace_id NOT IN (SELECT id FROM workspaces);

-- Step 2: Add the foreign key constraint
ALTER TABLE work_items
ADD CONSTRAINT work_items_workspace_id_fkey
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add comment explaining the relationship
COMMENT ON CONSTRAINT work_items_workspace_id_fkey ON work_items IS 'Links work items to their parent workspace. Cascade delete ensures cleanup when workspace is removed.';
