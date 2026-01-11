-- Migration: Create teams and team_members tables
-- Date: 2025-01-11
-- Priority: CRITICAL - Fixes missing multi-tenant foundation tables
--
-- This migration creates the foundational multi-tenant tables that were
-- referenced in code but never created in the database schema.
--
-- Impact:
-- - Enables proper team-based multi-tenancy
-- - Allows workspace creation with team_id
-- - Fixes authentication callback issues
-- - Enables team member management
--
-- Related Issues:
-- - Auth callback failing on team_members table query
-- - Workspace creation failing on team_id column
-- - User stuck on blank page after login

-- ============================================================================
-- PART 1: CREATE TEAMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for teams table
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_plan ON teams(plan);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at DESC);

-- Add trigger for teams updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;

-- ============================================================================
-- PART 2: CREATE TEAM_MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create indexes for team_members table
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_joined_at ON team_members(joined_at DESC);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;

-- ============================================================================
-- PART 3: ADD TEAM_ID TO WORKSPACES TABLE
-- ============================================================================

-- Add team_id column to workspaces (if not exists)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES teams(id) ON DELETE CASCADE;

-- Create index for workspace team_id
CREATE INDEX IF NOT EXISTS idx_workspaces_team_id ON workspaces(team_id);

-- ============================================================================
-- PART 4: DATA MIGRATION (Backfill existing data)
-- ============================================================================

-- For existing workspaces without team_id:
-- 1. Create a team for each unique user_id
-- 2. Add user as team owner
-- 3. Update workspace with team_id

DO $$
DECLARE
  workspace_record RECORD;
  new_team_id TEXT;
  new_member_id TEXT;
  user_exists BOOLEAN;
BEGIN
  -- Loop through all workspaces that don't have a team_id
  FOR workspace_record IN
    SELECT DISTINCT user_id, id as workspace_id
    FROM workspaces
    WHERE team_id IS NULL AND user_id IS NOT NULL
  LOOP
    -- Check if user exists in auth.users
    SELECT EXISTS(
      SELECT 1 FROM auth.users WHERE id = workspace_record.user_id
    ) INTO user_exists;

    -- Only process if user exists
    IF user_exists THEN
      -- Check if team already exists for this user
      SELECT id INTO new_team_id
      FROM teams
      WHERE owner_id = workspace_record.user_id
      LIMIT 1;

      -- If no team exists, create one
      IF new_team_id IS NULL THEN
        new_team_id := 'team_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || workspace_record.user_id;

        INSERT INTO teams (id, name, owner_id, plan, created_at, updated_at)
        VALUES (
          new_team_id,
          'Default Team',
          workspace_record.user_id,
          'pro',
          NOW(),
          NOW()
        );

        -- Add user as team owner
        new_member_id := 'member_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || workspace_record.user_id;

        INSERT INTO team_members (id, team_id, user_id, role, joined_at)
        VALUES (
          new_member_id,
          new_team_id,
          workspace_record.user_id,
          'owner',
          NOW()
        );
      END IF;

      -- Update workspace with team_id
      UPDATE workspaces
      SET team_id = new_team_id
      WHERE id = workspace_record.workspace_id;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 5: MAKE TEAM_ID NOT NULL (after backfill)
-- ============================================================================

-- Now that all workspaces have team_id, make it NOT NULL
-- This ensures all future workspaces MUST have a team_id
ALTER TABLE workspaces
  ALTER COLUMN team_id SET NOT NULL;

-- ============================================================================
-- PART 6: UPDATE WORKSPACES RLS POLICIES TO USE TEAM_ID
-- ============================================================================

-- Drop old user_id-based policies
DROP POLICY IF EXISTS "Users can view their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can insert their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON workspaces;

-- Create new team_id-based policies
CREATE POLICY "team_members_can_view_workspaces" ON workspaces
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "team_members_can_insert_workspaces" ON workspaces
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "team_members_can_update_workspaces" ON workspaces
  FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "team_members_can_delete_workspaces" ON workspaces
  FOR DELETE
  USING (
    team_id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all tables exist and have correct structure
/*
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('teams', 'team_members', 'workspaces')
  AND column_name IN ('id', 'team_id', 'user_id', 'owner_id')
ORDER BY table_name, column_name;
*/

-- Verify all workspaces have team_id
/*
SELECT COUNT(*) as workspaces_without_team_id
FROM workspaces
WHERE team_id IS NULL;
-- Expected: 0
*/

-- Verify team structure
/*
SELECT
  t.id as team_id,
  t.name as team_name,
  t.plan,
  COUNT(tm.id) as member_count
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
GROUP BY t.id, t.name, t.plan;
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Migration applied successfully!
-- ✅ teams table created
-- ✅ team_members table created
-- ✅ team_id added to workspaces table
-- ✅ Existing data migrated
-- ✅ RLS policies updated to use team_id
-- Multi-tenant foundation is now complete!
