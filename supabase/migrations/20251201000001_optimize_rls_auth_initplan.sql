-- Migration: Optimize RLS policies for auth.uid() and current_setting() performance
-- Issue: auth.uid() and current_setting() re-evaluated per row instead of once per query
-- Fix: Wrap these functions in (select ...) to create scalar subqueries
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- STEP 1: Drop policies that depend on helper functions FIRST
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team roster" ON team_members;
DROP POLICY IF EXISTS "Users can join teams or admins can add members" ON team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON team_members;

-- ============================================================================
-- STEP 2: Drop and recreate helper functions with optimized auth calls
-- ============================================================================
DROP FUNCTION IF EXISTS user_is_team_member(text);
DROP FUNCTION IF EXISTS user_is_team_admin(text);

CREATE FUNCTION user_is_team_member(p_team_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
    AND user_id = (select auth.uid())
  );
$$;

CREATE FUNCTION user_is_team_admin(p_team_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
    AND user_id = (select auth.uid())
    AND role IN ('owner', 'admin')
  );
$$;

-- ============================================================================
-- TABLE: ai_usage
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view AI usage" ON ai_usage;

CREATE POLICY "Team members can view AI usage" ON ai_usage
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = ai_usage.team_id
    AND team_members.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: connection_insights
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team insights" ON connection_insights;
DROP POLICY IF EXISTS "Team members can create insights" ON connection_insights;
DROP POLICY IF EXISTS "Team members can update team insights" ON connection_insights;
DROP POLICY IF EXISTS "Team members can delete team insights" ON connection_insights;

CREATE POLICY "Team members can view team insights" ON connection_insights
FOR SELECT USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can create insights" ON connection_insights
FOR INSERT WITH CHECK (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can update team insights" ON connection_insights
FOR UPDATE USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
) WITH CHECK (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can delete team insights" ON connection_insights
FOR DELETE USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

-- ============================================================================
-- TABLE: custom_dashboards
-- ============================================================================
DROP POLICY IF EXISTS "Workspace members can manage dashboards" ON custom_dashboards;

CREATE POLICY "Workspace members can manage dashboards" ON custom_dashboards
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE w.id = custom_dashboards.workspace_id
    AND tm.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: execution_steps
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own execution steps" ON execution_steps;
DROP POLICY IF EXISTS "Users can insert their own execution steps" ON execution_steps;
DROP POLICY IF EXISTS "Users can update their own execution steps" ON execution_steps;
DROP POLICY IF EXISTS "Users can delete their own execution steps" ON execution_steps;

CREATE POLICY "Users can view their own execution steps" ON execution_steps
FOR SELECT USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can insert their own execution steps" ON execution_steps
FOR INSERT WITH CHECK (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can update their own execution steps" ON execution_steps
FOR UPDATE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can delete their own execution steps" ON execution_steps
FOR DELETE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

-- ============================================================================
-- TABLE: feature_correlations
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team correlations" ON feature_correlations;
DROP POLICY IF EXISTS "Team members can create correlations" ON feature_correlations;
DROP POLICY IF EXISTS "Team members can update team correlations" ON feature_correlations;
DROP POLICY IF EXISTS "Team members can delete team correlations" ON feature_correlations;

CREATE POLICY "Team members can view team correlations" ON feature_correlations
FOR SELECT USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can create correlations" ON feature_correlations
FOR INSERT WITH CHECK (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can update team correlations" ON feature_correlations
FOR UPDATE USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
) WITH CHECK (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can delete team correlations" ON feature_correlations
FOR DELETE USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

-- ============================================================================
-- TABLE: feature_importance_scores
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team importance scores" ON feature_importance_scores;
DROP POLICY IF EXISTS "Team members can create importance scores" ON feature_importance_scores;
DROP POLICY IF EXISTS "Team members can update team importance scores" ON feature_importance_scores;
DROP POLICY IF EXISTS "Team members can delete team importance scores" ON feature_importance_scores;

CREATE POLICY "Team members can view team importance scores" ON feature_importance_scores
FOR SELECT USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can create importance scores" ON feature_importance_scores
FOR INSERT WITH CHECK (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can update team importance scores" ON feature_importance_scores
FOR UPDATE USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
) WITH CHECK (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can delete team importance scores" ON feature_importance_scores
FOR DELETE USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

-- ============================================================================
-- TABLE: feature_resources
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own feature resources" ON feature_resources;
DROP POLICY IF EXISTS "Users can insert their own feature resources" ON feature_resources;
DROP POLICY IF EXISTS "Users can update their own feature resources" ON feature_resources;
DROP POLICY IF EXISTS "Users can delete their own feature resources" ON feature_resources;

CREATE POLICY "Users can view their own feature resources" ON feature_resources
FOR SELECT USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can insert their own feature resources" ON feature_resources
FOR INSERT WITH CHECK (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can update their own feature resources" ON feature_resources
FOR UPDATE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can delete their own feature resources" ON feature_resources
FOR DELETE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

-- ============================================================================
-- TABLE: feedback
-- ============================================================================
DROP POLICY IF EXISTS "Users can view feedback for their team" ON feedback;
DROP POLICY IF EXISTS "Users can insert feedback for their team" ON feedback;
DROP POLICY IF EXISTS "Users can update feedback for their team" ON feedback;
DROP POLICY IF EXISTS "Users can delete feedback for their team" ON feedback;

CREATE POLICY "Users can view feedback for their team" ON feedback
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can insert feedback for their team" ON feedback
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can update feedback for their team" ON feedback
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can delete feedback for their team" ON feedback
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: inspiration_items
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own inspiration items" ON inspiration_items;
DROP POLICY IF EXISTS "Users can insert their own inspiration items" ON inspiration_items;
DROP POLICY IF EXISTS "Users can update their own inspiration items" ON inspiration_items;
DROP POLICY IF EXISTS "Users can delete their own inspiration items" ON inspiration_items;

CREATE POLICY "Users can view their own inspiration items" ON inspiration_items
FOR SELECT USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can insert their own inspiration items" ON inspiration_items
FOR INSERT WITH CHECK (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can update their own inspiration items" ON inspiration_items
FOR UPDATE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can delete their own inspiration items" ON inspiration_items
FOR DELETE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

-- ============================================================================
-- TABLE: invitations
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view invitations" ON invitations;
DROP POLICY IF EXISTS "Team admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Team admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Team admins can delete invitations" ON invitations;

CREATE POLICY "Team members can view invitations" ON invitations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = invitations.team_id
    AND team_members.user_id = (select auth.uid())
    AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

CREATE POLICY "Team admins can create invitations" ON invitations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = invitations.team_id
    AND team_members.user_id = (select auth.uid())
    AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

CREATE POLICY "Team admins can update invitations" ON invitations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = invitations.team_id
    AND team_members.user_id = (select auth.uid())
    AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

CREATE POLICY "Team admins can delete invitations" ON invitations
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = invitations.team_id
    AND team_members.user_id = (select auth.uid())
    AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

-- ============================================================================
-- TABLE: linked_items
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team timeline dependencies" ON linked_items;
DROP POLICY IF EXISTS "Team members can create timeline dependencies" ON linked_items;
DROP POLICY IF EXISTS "Team members can update team timeline dependencies" ON linked_items;
DROP POLICY IF EXISTS "Team members can delete team timeline dependencies" ON linked_items;

CREATE POLICY "Team members can view team timeline dependencies" ON linked_items
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create timeline dependencies" ON linked_items
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update team timeline dependencies" ON linked_items
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete team timeline dependencies" ON linked_items
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: milestones
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can insert their own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can update their own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can delete their own milestones" ON milestones;

CREATE POLICY "Users can view their own milestones" ON milestones
FOR SELECT USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can insert their own milestones" ON milestones
FOR INSERT WITH CHECK (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can update their own milestones" ON milestones
FOR UPDATE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can delete their own milestones" ON milestones
FOR DELETE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

-- ============================================================================
-- TABLE: mind_map_edges
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team mind map edges" ON mind_map_edges;
DROP POLICY IF EXISTS "Team members can create mind map edges" ON mind_map_edges;
DROP POLICY IF EXISTS "Team members can update team mind map edges" ON mind_map_edges;
DROP POLICY IF EXISTS "Team members can delete mind map edges" ON mind_map_edges;
DROP POLICY IF EXISTS "Workspace members can manage mind map edges" ON mind_map_edges;

CREATE POLICY "Team members can view team mind map edges" ON mind_map_edges
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create mind map edges" ON mind_map_edges
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update team mind map edges" ON mind_map_edges
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete mind map edges" ON mind_map_edges
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Workspace members can manage mind map edges" ON mind_map_edges
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM mind_maps mm
    JOIN workspaces w ON w.id = mm.workspace_id
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE mm.id = mind_map_edges.mind_map_id
    AND tm.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: mind_map_nodes
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team mind map nodes" ON mind_map_nodes;
DROP POLICY IF EXISTS "Team members can create mind map nodes" ON mind_map_nodes;
DROP POLICY IF EXISTS "Team members can update team mind map nodes" ON mind_map_nodes;
DROP POLICY IF EXISTS "Team members can delete team mind map nodes" ON mind_map_nodes;
DROP POLICY IF EXISTS "Workspace members can manage mind map nodes" ON mind_map_nodes;

CREATE POLICY "Team members can view team mind map nodes" ON mind_map_nodes
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create mind map nodes" ON mind_map_nodes
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update team mind map nodes" ON mind_map_nodes
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete team mind map nodes" ON mind_map_nodes
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Workspace members can manage mind map nodes" ON mind_map_nodes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM mind_maps mm
    JOIN workspaces w ON w.id = mm.workspace_id
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE mm.id = mind_map_nodes.mind_map_id
    AND tm.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: mind_maps
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team mind maps" ON mind_maps;
DROP POLICY IF EXISTS "Team members can create mind maps" ON mind_maps;
DROP POLICY IF EXISTS "Team members can update team mind maps" ON mind_maps;
DROP POLICY IF EXISTS "Team members can delete team mind maps" ON mind_maps;
DROP POLICY IF EXISTS "Workspace members can manage mind maps" ON mind_maps;

CREATE POLICY "Team members can view team mind maps" ON mind_maps
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create mind maps" ON mind_maps
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update team mind maps" ON mind_maps
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete team mind maps" ON mind_maps
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Workspace members can manage mind maps" ON mind_maps
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE w.id = mind_maps.workspace_id
    AND tm.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: prerequisites
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own prerequisites" ON prerequisites;
DROP POLICY IF EXISTS "Users can insert their own prerequisites" ON prerequisites;
DROP POLICY IF EXISTS "Users can update their own prerequisites" ON prerequisites;
DROP POLICY IF EXISTS "Users can delete their own prerequisites" ON prerequisites;

CREATE POLICY "Users can view their own prerequisites" ON prerequisites
FOR SELECT USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can insert their own prerequisites" ON prerequisites
FOR INSERT WITH CHECK (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can update their own prerequisites" ON prerequisites
FOR UPDATE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can delete their own prerequisites" ON prerequisites
FOR DELETE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

-- ============================================================================
-- TABLE: product_tasks
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view product tasks" ON product_tasks;
DROP POLICY IF EXISTS "Team members can create product tasks" ON product_tasks;
DROP POLICY IF EXISTS "Team members can update product tasks" ON product_tasks;
DROP POLICY IF EXISTS "Team members can delete product tasks" ON product_tasks;

CREATE POLICY "Team members can view product tasks" ON product_tasks
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create product tasks" ON product_tasks
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update product tasks" ON product_tasks
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete product tasks" ON product_tasks
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: resource_audit_log
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view resource audit log" ON resource_audit_log;

CREATE POLICY "Team members can view resource audit log" ON resource_audit_log
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: resources
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view resources" ON resources;
DROP POLICY IF EXISTS "Team members can create resources" ON resources;
DROP POLICY IF EXISTS "Team members can update resources" ON resources;
DROP POLICY IF EXISTS "Creator or admin can delete resources" ON resources;

CREATE POLICY "Team members can view resources" ON resources
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create resources" ON resources
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update resources" ON resources
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Creator or admin can delete resources" ON resources
FOR DELETE USING (
  created_by = (select auth.uid())
  OR team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
    AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

-- ============================================================================
-- TABLE: review_links
-- ============================================================================
DROP POLICY IF EXISTS "Workspace members can create review links" ON review_links;

CREATE POLICY "Workspace members can create review links" ON review_links
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE w.id = review_links.workspace_id
    AND tm.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: risks
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own risks" ON risks;
DROP POLICY IF EXISTS "Users can insert their own risks" ON risks;
DROP POLICY IF EXISTS "Users can update their own risks" ON risks;
DROP POLICY IF EXISTS "Users can delete their own risks" ON risks;

CREATE POLICY "Users can view their own risks" ON risks
FOR SELECT USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can insert their own risks" ON risks
FOR INSERT WITH CHECK (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can update their own risks" ON risks
FOR UPDATE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can delete their own risks" ON risks
FOR DELETE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team subscription" ON subscriptions;
DROP POLICY IF EXISTS "Team owners can create subscription" ON subscriptions;
DROP POLICY IF EXISTS "Team owners and admins can update subscription" ON subscriptions;
DROP POLICY IF EXISTS "Team owners can delete subscription" ON subscriptions;

CREATE POLICY "Team members can view team subscription" ON subscriptions
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team owners can create subscription" ON subscriptions
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
    AND team_members.role = 'owner'::text
  )
);

CREATE POLICY "Team owners and admins can update subscription" ON subscriptions
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
    AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
) WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
    AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

CREATE POLICY "Team owners can delete subscription" ON subscriptions
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
    AND team_members.role = 'owner'::text
  )
);

-- ============================================================================
-- TABLE: success_metrics
-- ============================================================================
DROP POLICY IF EXISTS "Workspace members can manage metrics" ON success_metrics;

CREATE POLICY "Workspace members can manage metrics" ON success_metrics
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE w.id = success_metrics.workspace_id
    AND tm.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: team_members
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own team memberships" ON team_members;

CREATE POLICY "Users can view own team memberships" ON team_members
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Team members can view team roster" ON team_members
FOR SELECT USING (user_is_team_member(team_id));

CREATE POLICY "Users can join teams or admins can add members" ON team_members
FOR INSERT WITH CHECK (
  user_id = (select auth.uid()) OR user_is_team_admin(team_id)
);

CREATE POLICY "Admins can update team members" ON team_members
FOR UPDATE USING (user_is_team_admin(team_id));

CREATE POLICY "Admins can delete team members" ON team_members
FOR DELETE USING (user_is_team_admin(team_id));

-- ============================================================================
-- TABLE: teams
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;
DROP POLICY IF EXISTS "Anyone can create teams" ON teams;
DROP POLICY IF EXISTS "Owners can update their teams" ON teams;

CREATE POLICY "Team members can view their teams" ON teams
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Anyone can create teams" ON teams
FOR INSERT WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Owners can update their teams" ON teams
FOR UPDATE USING (owner_id = (select auth.uid()));

-- ============================================================================
-- TABLE: timeline_items
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team timeline items" ON timeline_items;
DROP POLICY IF EXISTS "Team members can create timeline items" ON timeline_items;
DROP POLICY IF EXISTS "Team members can update team timeline items" ON timeline_items;
DROP POLICY IF EXISTS "Team members can delete team timeline items" ON timeline_items;

CREATE POLICY "Team members can view team timeline items" ON timeline_items
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create timeline items" ON timeline_items
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update team timeline items" ON timeline_items
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete team timeline items" ON timeline_items
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: user_phase_assignments
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view phase assignments" ON user_phase_assignments;
DROP POLICY IF EXISTS "Admins and phase leads can create phase assignments" ON user_phase_assignments;
DROP POLICY IF EXISTS "Admins and phase leads can update phase assignments" ON user_phase_assignments;
DROP POLICY IF EXISTS "Admins and phase leads can delete phase assignments" ON user_phase_assignments;

CREATE POLICY "Team members can view phase assignments" ON user_phase_assignments
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins and phase leads can create phase assignments" ON user_phase_assignments
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
  AND (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = (select auth.uid())
      AND team_members.team_id = user_phase_assignments.team_id
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
    )
    OR EXISTS (
      SELECT 1 FROM user_phase_assignments upa
      WHERE upa.user_id = (select auth.uid())
      AND upa.workspace_id = user_phase_assignments.workspace_id
      AND upa.phase = user_phase_assignments.phase
      AND upa.is_lead = true
    )
  )
);

CREATE POLICY "Admins and phase leads can update phase assignments" ON user_phase_assignments
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
  AND (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = (select auth.uid())
      AND team_members.team_id = user_phase_assignments.team_id
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
    )
    OR EXISTS (
      SELECT 1 FROM user_phase_assignments upa
      WHERE upa.user_id = (select auth.uid())
      AND upa.workspace_id = user_phase_assignments.workspace_id
      AND upa.phase = user_phase_assignments.phase
      AND upa.is_lead = true
    )
  )
);

CREATE POLICY "Admins and phase leads can delete phase assignments" ON user_phase_assignments
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
  AND (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = (select auth.uid())
      AND team_members.team_id = user_phase_assignments.team_id
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
    )
    OR EXISTS (
      SELECT 1 FROM user_phase_assignments upa
      WHERE upa.user_id = (select auth.uid())
      AND upa.workspace_id = user_phase_assignments.workspace_id
      AND upa.phase = user_phase_assignments.phase
      AND upa.is_lead = true
    )
  )
);

-- ============================================================================
-- TABLE: user_settings
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;

CREATE POLICY "Users can view own settings" ON user_settings
FOR SELECT USING (user_id = ((select auth.uid()))::text);

CREATE POLICY "Users can insert own settings" ON user_settings
FOR INSERT WITH CHECK (user_id = ((select auth.uid()))::text);

CREATE POLICY "Users can update own settings" ON user_settings
FOR UPDATE USING (user_id = ((select auth.uid()))::text)
WITH CHECK (user_id = ((select auth.uid()))::text);

CREATE POLICY "Users can delete own settings" ON user_settings
FOR DELETE USING (user_id = ((select auth.uid()))::text);

-- ============================================================================
-- TABLE: users
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON users
FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING ((select auth.uid()) = id);

-- ============================================================================
-- TABLE: work_flows
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view work flows" ON work_flows;
DROP POLICY IF EXISTS "Team members can create work flows" ON work_flows;
DROP POLICY IF EXISTS "Team members can update work flows" ON work_flows;
DROP POLICY IF EXISTS "Team members can delete work flows" ON work_flows;

CREATE POLICY "Team members can view work flows" ON work_flows
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create work flows" ON work_flows
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update work flows" ON work_flows
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete work flows" ON work_flows
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: work_item_connections
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team feature connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can view work item connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can create feature connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can create work item connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can update team feature connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can update work item connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can delete team feature connections" ON work_item_connections;
DROP POLICY IF EXISTS "Team members can delete work item connections" ON work_item_connections;

CREATE POLICY "Team members can view team feature connections" ON work_item_connections
FOR SELECT USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can view work item connections" ON work_item_connections
FOR SELECT USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE tm.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create feature connections" ON work_item_connections
FOR INSERT WITH CHECK (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can create work item connections" ON work_item_connections
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE tm.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update team feature connections" ON work_item_connections
FOR UPDATE USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
) WITH CHECK (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can update work item connections" ON work_item_connections
FOR UPDATE USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE tm.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete team feature connections" ON work_item_connections
FOR DELETE USING (
  user_id IN (
    SELECT (team_members.user_id)::text
    FROM team_members
    WHERE team_members.team_id IN (
      SELECT team_members_1.team_id FROM team_members team_members_1
      WHERE team_members_1.user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Team members can delete work item connections" ON work_item_connections
FOR DELETE USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN team_members tm ON tm.team_id = w.team_id
    WHERE tm.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: work_item_resources
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view work item resources" ON work_item_resources;
DROP POLICY IF EXISTS "Team members can link resources" ON work_item_resources;
DROP POLICY IF EXISTS "Team members can update resource links" ON work_item_resources;
DROP POLICY IF EXISTS "Team members can delete resource links" ON work_item_resources;

CREATE POLICY "Team members can view work item resources" ON work_item_resources
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can link resources" ON work_item_resources
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update resource links" ON work_item_resources
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete resource links" ON work_item_resources
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: work_items
-- ============================================================================
DROP POLICY IF EXISTS "Team members can view team work items" ON work_items;
DROP POLICY IF EXISTS "Team members can create work items" ON work_items;
DROP POLICY IF EXISTS "Team members can update team work items" ON work_items;
DROP POLICY IF EXISTS "Team members can delete team work items" ON work_items;

CREATE POLICY "Team members can view team work items" ON work_items
FOR SELECT USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create work items" ON work_items
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update team work items" ON work_items
FOR UPDATE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can delete team work items" ON work_items
FOR DELETE USING (
  team_id IN (
    SELECT team_members.team_id FROM team_members
    WHERE team_members.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- TABLE: workspaces
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can insert their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Team members can view workspaces" ON workspaces;
DROP POLICY IF EXISTS "Team members can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Team members can update workspaces" ON workspaces;

CREATE POLICY "Users can view their own workspaces" ON workspaces
FOR SELECT USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can insert their own workspaces" ON workspaces
FOR INSERT WITH CHECK (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can update their own workspaces" ON workspaces
FOR UPDATE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Users can delete their own workspaces" ON workspaces
FOR DELETE USING (
  user_id = (((select current_setting('request.jwt.claims'::text, true))::json) ->> 'sub'::text)
  OR user_id = (select current_setting('app.user_id'::text, true))
);

CREATE POLICY "Team members can view workspaces" ON workspaces
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = workspaces.team_id
    AND team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can create workspaces" ON workspaces
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = workspaces.team_id
    AND team_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Team members can update workspaces" ON workspaces
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = workspaces.team_id
    AND team_members.user_id = (select auth.uid())
  )
);
