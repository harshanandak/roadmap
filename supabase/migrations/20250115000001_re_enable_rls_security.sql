-- ========== CRITICAL SECURITY FIX ==========
-- Re-enable Row-Level Security (RLS) for multi-tenant data isolation
-- Addresses vulnerabilities identified in SECURITY_AUDIT_REPORT.md
--
-- Tables Fixed:
--   - work_items (RLS re-enabled)
--   - timeline_items (RLS re-enabled + policies created)
--   - linked_items (RLS re-enabled + policies created)
--
-- Date: 2025-11-15
-- Severity: CRITICAL
-- Impact: Fixes data breach vulnerability

-- ========== STEP 1: RE-ENABLE RLS ON CORE TABLES ==========

ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_items ENABLE ROW LEVEL SECURITY;

-- ========== STEP 2: REVOKE ANONYMOUS USER PERMISSIONS ==========
-- Remove dangerous GRANT ALL permissions from anonymous users

REVOKE ALL ON work_items FROM anon;
REVOKE ALL ON timeline_items FROM anon;
REVOKE ALL ON linked_items FROM anon;
REVOKE ALL ON user_settings FROM anon;

-- ========== STEP 3: GRANT LIMITED PERMISSIONS TO AUTHENTICATED USERS ==========
-- Authenticated users get read-only by default (limited by RLS policies)

GRANT SELECT ON work_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON work_items TO authenticated;

GRANT SELECT ON timeline_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON timeline_items TO authenticated;

GRANT SELECT ON linked_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON linked_items TO authenticated;

-- ========== STEP 4: CREATE RLS POLICIES FOR TIMELINE_ITEMS ==========

-- SELECT: View timeline items for work items in user's teams
CREATE POLICY "Team members can view team timeline items"
ON timeline_items FOR SELECT
USING (
  work_item_id IN (
    SELECT id FROM work_items
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- INSERT: Create timeline items only for work items in user's teams
CREATE POLICY "Team members can create timeline items"
ON timeline_items FOR INSERT
WITH CHECK (
  work_item_id IN (
    SELECT id FROM work_items
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- UPDATE: Modify timeline items only for work items in user's teams
CREATE POLICY "Team members can update team timeline items"
ON timeline_items FOR UPDATE
USING (
  work_item_id IN (
    SELECT id FROM work_items
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- DELETE: Remove timeline items only for work items in user's teams
CREATE POLICY "Team members can delete team timeline items"
ON timeline_items FOR DELETE
USING (
  work_item_id IN (
    SELECT id FROM work_items
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- ========== STEP 5: CREATE RLS POLICIES FOR LINKED_ITEMS ==========

-- SELECT: View linked items where source OR target is in user's teams
CREATE POLICY "Team members can view team linked items"
ON linked_items FOR SELECT
USING (
  source_item_id IN (
    SELECT ti.id FROM timeline_items ti
    JOIN work_items w ON w.id = ti.work_item_id
    WHERE w.team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
  OR target_item_id IN (
    SELECT ti.id FROM timeline_items ti
    JOIN work_items w ON w.id = ti.work_item_id
    WHERE w.team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- INSERT: Create linked items only for timeline items in user's teams
CREATE POLICY "Team members can create linked items"
ON linked_items FOR INSERT
WITH CHECK (
  source_item_id IN (
    SELECT ti.id FROM timeline_items ti
    JOIN work_items w ON w.id = ti.work_item_id
    WHERE w.team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
  AND target_item_id IN (
    SELECT ti.id FROM timeline_items ti
    JOIN work_items w ON w.id = ti.work_item_id
    WHERE w.team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- UPDATE: Modify linked items only for timeline items in user's teams
CREATE POLICY "Team members can update team linked items"
ON linked_items FOR UPDATE
USING (
  source_item_id IN (
    SELECT ti.id FROM timeline_items ti
    JOIN work_items w ON w.id = ti.work_item_id
    WHERE w.team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- DELETE: Remove linked items only for timeline items in user's teams
CREATE POLICY "Team members can delete team linked items"
ON linked_items FOR DELETE
USING (
  source_item_id IN (
    SELECT ti.id FROM timeline_items ti
    JOIN work_items w ON w.id = ti.work_item_id
    WHERE w.team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

-- ========== STEP 6: ADD COMMENTS FOR DOCUMENTATION ==========

COMMENT ON POLICY "Team members can view team timeline items" ON timeline_items
IS 'Users can view timeline items for work items in their teams';

COMMENT ON POLICY "Team members can create timeline items" ON timeline_items
IS 'Users can create timeline items only for work items in their teams';

COMMENT ON POLICY "Team members can update team timeline items" ON timeline_items
IS 'Users can update timeline items only for work items in their teams';

COMMENT ON POLICY "Team members can delete team timeline items" ON timeline_items
IS 'Users can delete timeline items only for work items in their teams';

COMMENT ON POLICY "Team members can view team linked items" ON linked_items
IS 'Users can view dependencies where source OR target is in their teams';

COMMENT ON POLICY "Team members can create linked items" ON linked_items
IS 'Users can create dependencies only between timeline items in their teams';

COMMENT ON POLICY "Team members can update team linked items" ON linked_items
IS 'Users can update dependencies only for timeline items in their teams';

COMMENT ON POLICY "Team members can delete team linked items" ON linked_items
IS 'Users can delete dependencies only for timeline items in their teams';

-- ========== VERIFICATION ==========
-- After applying this migration, verify:
--   1. RLS is enabled: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--   2. Policies exist: SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
--   3. Test multi-tenant isolation (see SECURITY_AUDIT_REPORT.md)
