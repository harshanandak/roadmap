-- Mind Mapping Module Tables
-- Week 3: Core functionality (AI features come in Week 7)
-- Three tables: mind_maps, mind_map_nodes, mind_map_edges

-- ========== MIND MAPS TABLE ==========
-- Stores the canvas container and metadata
CREATE TABLE IF NOT EXISTS mind_maps (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  canvas_data JSONB NOT NULL DEFAULT '{"zoom": 1, "position": [0, 0]}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== MIND MAP NODES TABLE ==========
-- Individual nodes on the canvas (5 types)
CREATE TABLE IF NOT EXISTS mind_map_nodes (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('idea', 'problem', 'solution', 'feature', 'question')),
  title TEXT NOT NULL,
  description TEXT,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}'::jsonb,
  data JSONB DEFAULT '{}'::jsonb,
  style JSONB DEFAULT '{}'::jsonb,
  converted_to_work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== MIND MAP EDGES TABLE ==========
-- Connections between nodes
CREATE TABLE IF NOT EXISTS mind_map_edges (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  target_node_id TEXT NOT NULL REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  edge_type TEXT DEFAULT 'default',
  label TEXT,
  style JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_node_id, target_node_id)
);

-- ========== INDEXES ==========
-- Mind maps indexes
CREATE INDEX IF NOT EXISTS idx_mind_maps_team_id ON mind_maps(team_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_workspace_id ON mind_maps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_user_id ON mind_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_created_at ON mind_maps(created_at DESC);

-- Mind map nodes indexes
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_mind_map_id ON mind_map_nodes(mind_map_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_team_id ON mind_map_nodes(team_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_node_type ON mind_map_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_converted ON mind_map_nodes(converted_to_work_item_id) WHERE converted_to_work_item_id IS NOT NULL;

-- Mind map edges indexes
CREATE INDEX IF NOT EXISTS idx_mind_map_edges_mind_map_id ON mind_map_edges(mind_map_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_edges_team_id ON mind_map_edges(team_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_edges_source ON mind_map_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_edges_target ON mind_map_edges(target_node_id);

-- ========== ROW LEVEL SECURITY (RLS) ==========
ALTER TABLE mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_edges ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES: MIND MAPS ==========
CREATE POLICY "Team members can view team mind maps"
ON mind_maps FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create mind maps"
ON mind_maps FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update team mind maps"
ON mind_maps FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete team mind maps"
ON mind_maps FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- ========== RLS POLICIES: MIND MAP NODES ==========
CREATE POLICY "Team members can view team mind map nodes"
ON mind_map_nodes FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create mind map nodes"
ON mind_map_nodes FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update team mind map nodes"
ON mind_map_nodes FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete team mind map nodes"
ON mind_map_nodes FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- ========== RLS POLICIES: MIND MAP EDGES ==========
CREATE POLICY "Team members can view team mind map edges"
ON mind_map_edges FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create mind map edges"
ON mind_map_edges FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update team mind map edges"
ON mind_map_edges FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete team mind map edges"
ON mind_map_edges FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- ========== TRIGGERS ==========
-- Update updated_at timestamp on mind_maps
CREATE TRIGGER update_mind_maps_updated_at
  BEFORE UPDATE ON mind_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp on mind_map_nodes
CREATE TRIGGER update_mind_map_nodes_updated_at
  BEFORE UPDATE ON mind_map_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========== COMMENTS ==========
COMMENT ON TABLE mind_maps IS 'Mind mapping canvases for visual brainstorming';
COMMENT ON TABLE mind_map_nodes IS 'Individual nodes on mind map canvas (5 types: idea, problem, solution, feature, question)';
COMMENT ON TABLE mind_map_edges IS 'Connections between mind map nodes';

COMMENT ON COLUMN mind_map_nodes.node_type IS 'Type of node: idea (blue), problem (red), solution (green), feature (purple), question (yellow)';
COMMENT ON COLUMN mind_map_nodes.converted_to_work_item_id IS 'Links to work_items table if node was converted to a feature';
COMMENT ON COLUMN mind_map_nodes.position IS 'ReactFlow position {x, y} in pixels';
COMMENT ON COLUMN mind_map_nodes.data IS 'Custom node metadata for ReactFlow';
COMMENT ON COLUMN mind_map_nodes.style IS 'Custom styling overrides (colors, sizes)';
COMMENT ON COLUMN mind_maps.canvas_data IS 'ReactFlow viewport state: zoom level and pan position';
