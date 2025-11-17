-- Improve linked_items table for timeline-level dependencies
-- This allows linking timeline items from different features

-- Drop the confusing 'direction' column (source/target is already directional)
ALTER TABLE linked_items DROP COLUMN IF EXISTS direction;

-- Add multi-tenancy support
ALTER TABLE linked_items ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE linked_items ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES teams(id) ON DELETE CASCADE;

-- Expand relationship types to be more descriptive
ALTER TABLE linked_items DROP CONSTRAINT IF EXISTS linked_items_relationship_type_check;
ALTER TABLE linked_items ADD CONSTRAINT linked_items_relationship_type_check
  CHECK (relationship_type IN (
    'blocks',        -- Source blocks target (target cannot start until source is done)
    'depends_on',    -- Source depends on target (source cannot start until target is done)
    'complements',   -- Source and target work well together
    'conflicts',     -- Source and target conflict with each other
    'extends'        -- Source extends/builds upon target
  ));

-- Add priority for dependencies
ALTER TABLE linked_items ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Add created_by for tracking
ALTER TABLE linked_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Add updated_at for tracking changes
ALTER TABLE linked_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_linked_items_workspace ON linked_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linked_items_team ON linked_items(team_id);
CREATE INDEX IF NOT EXISTS idx_linked_items_relationship_type ON linked_items(relationship_type);

-- Update RLS policies to use team-based access
DROP POLICY IF EXISTS "Users can view their own linked items" ON linked_items;
DROP POLICY IF EXISTS "Users can insert their own linked items" ON linked_items;
DROP POLICY IF EXISTS "Users can update their own linked items" ON linked_items;
DROP POLICY IF EXISTS "Users can delete their own linked items" ON linked_items;

-- New team-based RLS policies
CREATE POLICY "Team members can view team timeline dependencies"
ON linked_items FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create timeline dependencies"
ON linked_items FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update team timeline dependencies"
ON linked_items FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete team timeline dependencies"
ON linked_items FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_linked_items_updated_at
  BEFORE UPDATE ON linked_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get all timeline dependencies for a timeline item
CREATE OR REPLACE FUNCTION get_timeline_dependencies(timeline_item_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    -- Items this timeline item is blocking
    'blocking', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'targetTimelineId', li.target_item_id,
          'targetFeatureId', tt.feature_id,
          'targetFeatureName', f.name,
          'targetTimeline', tt.timeline,
          'relationship', li.relationship_type,
          'reason', li.reason,
          'priority', li.priority
        )
      )
      FROM linked_items li
      JOIN timeline_items tt ON tt.id = li.target_item_id
      JOIN features f ON f.id = tt.feature_id
      WHERE li.source_item_id = timeline_item_id_param
        AND li.relationship_type IN ('blocks', 'depends_on')
    ),
    -- Items blocking this timeline item
    'blocked_by', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'sourceTimelineId', li.source_item_id,
          'sourceFeatureId', st.feature_id,
          'sourceFeatureName', f.name,
          'sourceTimeline', st.timeline,
          'relationship', li.relationship_type,
          'reason', li.reason,
          'priority', li.priority
        )
      )
      FROM linked_items li
      JOIN timeline_items st ON st.id = li.source_item_id
      JOIN features f ON f.id = st.feature_id
      WHERE li.target_item_id = timeline_item_id_param
        AND li.relationship_type IN ('blocks', 'depends_on')
    ),
    -- Items that complement this one
    'complements', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'relatedTimelineId', CASE
            WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
            ELSE li.source_item_id
          END,
          'relatedFeatureId', t.feature_id,
          'relatedFeatureName', f.name,
          'relatedTimeline', t.timeline,
          'reason', li.reason
        )
      )
      FROM linked_items li
      JOIN timeline_items t ON t.id = CASE
        WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
        ELSE li.source_item_id
      END
      JOIN features f ON f.id = t.feature_id
      WHERE (li.source_item_id = timeline_item_id_param OR li.target_item_id = timeline_item_id_param)
        AND li.relationship_type = 'complements'
    ),
    -- Items that conflict with this one
    'conflicts', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'relatedTimelineId', CASE
            WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
            ELSE li.source_item_id
          END,
          'relatedFeatureId', t.feature_id,
          'relatedFeatureName', f.name,
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
      JOIN features f ON f.id = t.feature_id
      WHERE (li.source_item_id = timeline_item_id_param OR li.target_item_id = timeline_item_id_param)
        AND li.relationship_type = 'conflicts'
    ),
    -- Items this extends
    'extends', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'relatedTimelineId', CASE
            WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
            ELSE li.source_item_id
          END,
          'relatedFeatureId', t.feature_id,
          'relatedFeatureName', f.name,
          'relatedTimeline', t.timeline,
          'reason', li.reason
        )
      )
      FROM linked_items li
      JOIN timeline_items t ON t.id = CASE
        WHEN li.source_item_id = timeline_item_id_param THEN li.target_item_id
        ELSE li.source_item_id
      END
      JOIN features f ON f.id = t.feature_id
      WHERE (li.source_item_id = timeline_item_id_param OR li.target_item_id = timeline_item_id_param)
        AND li.relationship_type = 'extends'
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to get all dependencies for a feature (aggregated from timeline items)
CREATE OR REPLACE FUNCTION get_feature_dependencies_aggregated(feature_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Get all dependencies from this feature's timeline items to other features
  SELECT jsonb_agg(DISTINCT jsonb_build_object(
    'relatedFeatureId', f.id,
    'relatedFeatureName', f.name,
    'relationship', li.relationship_type,
    'timelineCount', (
      SELECT COUNT(*)
      FROM linked_items li2
      JOIN timeline_items st ON st.id = li2.source_item_id
      JOIN timeline_items tt ON tt.id = li2.target_item_id
      WHERE st.feature_id = feature_id_param
        AND tt.feature_id = f.id
        AND li2.relationship_type = li.relationship_type
    )
  ))
  INTO result
  FROM linked_items li
  JOIN timeline_items st ON st.id = li.source_item_id
  JOIN timeline_items tt ON tt.id = li.target_item_id
  JOIN features f ON f.id = tt.feature_id
  WHERE st.feature_id = feature_id_param
    AND tt.feature_id != feature_id_param;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
