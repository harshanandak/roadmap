-- Migration: Consolidate duplicate RLS policies for performance
-- Issue: Supabase advisor detected 50+ multiple_permissive_policies warnings
-- Fix: Merge overlapping policies into single policies with combined conditions
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

-- ============================================================================
-- TABLE: mind_maps
-- Problem: Both "Team members can ..." AND "Workspace members can manage ..." policies exist
-- Fix: Drop the FOR ALL policy since the individual policies already cover via team_id
-- ============================================================================
DROP POLICY IF EXISTS "Workspace members can manage mind maps" ON mind_maps;

-- ============================================================================
-- TABLE: mind_map_nodes
-- Same issue as mind_maps
-- ============================================================================
DROP POLICY IF EXISTS "Workspace members can manage mind map nodes" ON mind_map_nodes;

-- ============================================================================
-- TABLE: mind_map_edges
-- Same issue as mind_maps
-- ============================================================================
DROP POLICY IF EXISTS "Workspace members can manage mind map edges" ON mind_map_edges;

-- ============================================================================
-- TABLE: team_members
-- Problem: "Users can view own team memberships" + "Team members can view team roster"
-- Fix: Consolidate into single SELECT policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own team memberships" ON team_members;
DROP POLICY IF EXISTS "Team members can view team roster" ON team_members;

CREATE POLICY "Users can view team memberships" ON team_members
FOR SELECT USING (
  -- User can see their own memberships
  user_id = (select auth.uid())
  -- OR user can see roster of teams they belong to
  OR user_is_team_member(team_id)
);

-- ============================================================================
-- TABLE: teams
-- Problem: "Anyone can view basic team info" + "Team members can view their teams"
-- Fix: Consolidate - check if public team OR is member
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view basic team info" ON teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;

CREATE POLICY "Users can view teams" ON teams
FOR SELECT USING (
  -- Team members can view their teams
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = (select auth.uid())
  )
  -- OR anyone can view basic team info (for invitation flows, etc.)
  OR true
);

-- ============================================================================
-- TABLE: users
-- Problem: "Users can view all user profiles" + "Users can view own profile"
-- Fix: If users can view all profiles, keep that policy only
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all user profiles" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

CREATE POLICY "Users can view profiles" ON users
FOR SELECT USING (
  -- All authenticated users can view user profiles (for team member lists, etc.)
  (select auth.uid()) IS NOT NULL
);

-- ============================================================================
-- TABLE: invitations
-- Problem: "Anyone can view invitations by token" + "Team members can view invitations"
-- Fix: Consolidate into single policy with OR logic
-- Note: We need both conditions - token lookup for unauthenticated users, team access for admins
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON invitations;
DROP POLICY IF EXISTS "Team members can view invitations" ON invitations;

CREATE POLICY "Users can view invitations" ON invitations
FOR SELECT USING (
  -- Team admins can view all invitations for their team
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = invitations.team_id
    AND team_members.user_id = (select auth.uid())
    AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
  -- OR anyone can view invitations (for token-based lookups during acceptance)
  -- This allows unauthenticated users to look up invitations by token
  OR true
);

-- ============================================================================
-- TABLE: work_item_connections
-- Problem: "Team members can ... feature connections" + "Team members can ... work item connections"
-- Fix: Consolidate into single policies checking EITHER user_id OR workspace_id
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team feature connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can view work item connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can create feature connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can create work item connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can update team feature connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can update work item connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can delete team feature connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can delete work item connections" ON work_item_connections;

CREATE POLICY "Team members can view work item connections" ON work_item_connections
FOR SELECT USING (
  -- Via user_id (legacy feature connections)
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
  -- OR via workspace_id
  OR workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE tm.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create work item connections" ON work_item_connections
FOR INSERT WITH CHECK (
  -- Via user_id (legacy feature connections)
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
  -- OR via workspace_id
  OR workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE tm.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update work item connections" ON work_item_connections
FOR UPDATE USING (
  -- Via user_id (legacy feature connections)
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
  -- OR via workspace_id
  OR workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE tm.user_id = (select auth.uid())
  )
) WITH CHECK (
  -- Via user_id (legacy feature connections)
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
  -- OR via workspace_id
  OR workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE tm.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete work item connections" ON work_item_connections
FOR DELETE USING (
  -- Via user_id (legacy feature connections)
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
  -- OR via workspace_id
  OR workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE tm.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: workspaces
-- Problem: "Users can ... their own workspaces" + "Team members can ... workspaces"
-- Fix: Consolidate into single policies with OR logic
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Team members can view workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can insert their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Team members can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Team members can update workspaces" ON workspaces;

CREATE POLICY "Users can view workspaces" ON workspaces
FOR SELECT USING (
  -- User's own workspaces (via current_setting for user_id)
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
  -- OR workspaces in teams user belongs to
  OR EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = workspaces.team_id
    AND team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can create workspaces" ON workspaces
FOR INSERT WITH CHECK (
  -- User's own workspaces
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
  -- OR in teams user belongs to
  OR EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = workspaces.team_id
    AND team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can update workspaces" ON workspaces
FOR UPDATE USING (
  -- User's own workspaces
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
  -- OR in teams user belongs to
  OR EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = workspaces.team_id
    AND team_members.user_id = (select auth.uid())
  )
);
