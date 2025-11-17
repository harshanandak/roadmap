-- Comprehensive rename: features → work_items for consistency
-- This aligns database terminology with UI terminology

-- Step 1: Rename the main table
ALTER TABLE IF EXISTS features RENAME TO work_items;

-- Step 2: Rename indexes on work_items table
ALTER INDEX IF EXISTS idx_features_user_id RENAME TO idx_work_items_user_id;
ALTER INDEX IF EXISTS idx_features_created_at RENAME TO idx_work_items_created_at;
ALTER INDEX IF EXISTS idx_features_team_id RENAME TO idx_work_items_team_id;
ALTER INDEX IF EXISTS idx_features_workspace_id RENAME TO idx_work_items_workspace_id;
ALTER INDEX IF EXISTS idx_features_converted_from RENAME TO idx_work_items_converted_from;

-- Step 3: Update RLS policies on work_items table
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "Users can view their own features" ON work_items;
  DROP POLICY IF EXISTS "Users can insert their own features" ON work_items;
  DROP POLICY IF EXISTS "Users can update their own features" ON work_items;
  DROP POLICY IF EXISTS "Users can delete their own features" ON work_items;
  DROP POLICY IF EXISTS "Team members can view team features" ON work_items;
  DROP POLICY IF EXISTS "Team members can create features" ON work_items;
  DROP POLICY IF EXISTS "Team members can update team features" ON work_items;
  DROP POLICY IF EXISTS "Team members can delete team features" ON work_items;
END $$;

-- Create new policies with updated names
CREATE POLICY "Team members can view team work items"
ON work_items FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create work items"
ON work_items FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update team work items"
ON work_items FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete team work items"
ON work_items FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Step 4: Rename triggers on work_items table
DROP TRIGGER IF EXISTS update_features_updated_at ON work_items;
CREATE TRIGGER update_work_items_updated_at
  BEFORE UPDATE ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Rename feature_id column in timeline_items table
ALTER TABLE IF EXISTS timeline_items RENAME COLUMN feature_id TO work_item_id;

-- Step 6: Rename usp column to description in timeline_items
ALTER TABLE IF EXISTS timeline_items RENAME COLUMN usp TO description;

-- Step 7: Update indexes on timeline_items
ALTER INDEX IF EXISTS idx_timeline_items_feature_id RENAME TO idx_timeline_items_work_item_id;

-- Step 8: Update linked_items function references
CREATE OR REPLACE FUNCTION get_timeline_dependencies(timeline_item_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'blocking', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'targetTimelineId', li.target_item_id,
          'targetWorkItemId', tt.work_item_id,
          'targetWorkItemName', w.name,
          'targetTimeline', tt.timeline,
          'relationship', li.relationship_type,
          'reason', li.reason,
          'priority', li.priority
        )
      )
      FROM linked_items li
      JOIN timeline_items tt ON tt.id = li.target_item_id
      JOIN work_items w ON w.id = tt.work_item_id
      WHERE li.source_item_id = timeline_item_id_param
        AND li.relationship_type IN ('blocks', 'depends_on')
    ),
    'blocked_by', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'sourceTimelineId', li.source_item_id,
          'sourceWorkItemId', st.work_item_id,
          'sourceWorkItemName', w.name,
          'sourceTimeline', st.timeline,
          'relationship', li.relationship_type,
          'reason', li.reason,
          'priority', li.priority
        )
      )
      FROM linked_items li
      JOIN timeline_items st ON st.id = li.source_item_id
      JOIN work_items w ON w.id = st.work_item_id
      WHERE li.target_item_id = timeline_item_id_param
        AND li.relationship_type IN ('blocks', 'depends_on')
    ),
    'complements', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'relatedTimelineId', CASE
            WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
            ELSE li.source_item_id
          END,
          'relatedWorkItemId', t.work_item_id,
          'relatedWorkItemName', w.name,
          'relatedTimeline', t.timeline,
          'reason', li.reason
        )
      )
      FROM linked_items li
      JOIN timeline_items t ON t.id = CASE
        WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
        ELSE li.source_item_id
      END
      JOIN work_items w ON w.id = t.work_item_id
      WHERE (li.source_item_id = timeline_item_id_param OR li.target_item_id = timeline_item_id_param)
        AND li.relationship_type = 'complements'
    ),
    'conflicts', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'relatedTimelineId', CASE
            WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
            ELSE li.source_item_id
          END,
          'relatedWorkItemId', t.work_item_id,
          'relatedWorkItemName', w.name,
          'relatedTimeline', t.timeline,
          'reason', li.reason,
          'priority', li.priority
        )
      )
      FROM linked_items li
      JOIN timeline_items t ON t.id = CASE
        WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
        ELSE li.source_item_id
      END
      JOIN work_items w ON w.id = t.work_item_id
      WHERE (li.source_item_id = timeline_item_id_param OR li.target_item_id = timeline_item_id_param)
        AND li.relationship_type = 'conflicts'
    ),
    'extends', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'relatedTimelineId', CASE
            WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
            ELSE li.source_item_id
          END,
          'relatedWorkItemId', t.work_item_id,
          'relatedWorkItemName', w.name,
          'relatedTimeline', t.timeline,
          'reason', li.reason
        )
      )
      FROM linked_items li
      JOIN timeline_items t ON t.id = CASE
        WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
        ELSE li.source_item_id
      END
      JOIN work_items w ON w.id = t.work_item_id
      WHERE (li.source_item_id = timeline_item_id_param OR li.target_item_id = timeline_item_id_param)
        AND li.relationship_type = 'extends'
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Step 9: Update aggregated function
CREATE OR REPLACE FUNCTION get_work_item_dependencies_aggregated(work_item_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(DISTINCT jsonb_build_object(
    'relatedWorkItemId', w.id,
    'relatedWorkItemName', w.name,
    'relationship', li.relationship_type,
    'timelineCount', (
      SELECT COUNT(*)
      FROM linked_items li2
      JOIN timeline_items st ON st.id = li2.source_item_id
      JOIN timeline_items tt ON tt.id = li2.target_item_id
      WHERE st.work_item_id = work_item_id_param
        AND tt.work_item_id = w.id
        AND li2.relationship_type = li.relationship_type
    )
  ))
  INTO result
  FROM linked_items li
  JOIN timeline_items st ON st.id = li.source_item_id
  JOIN timeline_items tt ON tt.id = li.target_item_id
  JOIN work_items w ON w.id = tt.work_item_id
  WHERE st.work_item_id = work_item_id_param
    AND tt.work_item_id != work_item_id_param;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Step 10: Drop old function with feature naming
DROP FUNCTION IF EXISTS get_feature_dependencies_aggregated(TEXT);

-- Step 11: Update conversion tracking function
CREATE OR REPLACE FUNCTION get_conversion_lineage(work_item_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  current_id TEXT;
  current_type TEXT;
  chain JSONB := '[]'::jsonb;
BEGIN
  current_id := work_item_id_param;

  -- Traverse up the conversion chain
  WHILE current_id IS NOT NULL LOOP
    SELECT jsonb_build_object(
      'id', id,
      'type', converted_from_type,
      'title', name,
      'convertedAt', converted_at,
      'convertedBy', converted_by
    ), converted_from_id, converted_from_type
    INTO chain, current_id, current_type
    FROM work_items
    WHERE id = current_id;

    IF current_id IS NULL THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN chain;
END;
$$;

-- Step 12: Update the table comment
COMMENT ON TABLE work_items IS 'Stores work items (features, enhancements, bugs, etc.) across all product lifecycle phases';
COMMENT ON TABLE timeline_items IS 'Timeline breakdowns (MVP/SHORT/LONG) for work items';
COMMENT ON TABLE linked_items IS 'Dependencies and relationships between timeline items';
