-- BlockSuite Documents Table
-- Phase 4: Supabase Persistence (Yjs + Real-time)
--
-- METADATA ONLY - Yjs binary state stored in Supabase Storage
-- This avoids PostgreSQL TOAST/WAL write amplification issues
--
-- Architecture:
-- - PostgreSQL: Document metadata, permissions, team_id/RLS
-- - Supabase Storage: Yjs binary state (blocksuite-yjs bucket)

CREATE TABLE blocksuite_documents (
  id TEXT PRIMARY KEY,                           -- Date.now().toString()
  team_id TEXT NOT NULL REFERENCES teams(id),    -- CRITICAL: NOT NULL for RLS
  workspace_id TEXT REFERENCES workspaces(id),
  mind_map_id TEXT REFERENCES mind_maps(id),     -- Link to migrated mind map

  -- Storage reference (NOT the actual Yjs state)
  storage_path TEXT NOT NULL,                    -- Path: {team_id}/{doc_id}.yjs
  storage_size_bytes INTEGER NOT NULL DEFAULT 0, -- Size for monitoring

  -- Document metadata
  document_type TEXT NOT NULL DEFAULT 'mindmap'
    CHECK (document_type IN ('mindmap', 'document', 'canvas')),
  title TEXT,

  -- Sync tracking
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  sync_version INTEGER NOT NULL DEFAULT 1,       -- Optimistic concurrency
  active_editors INTEGER NOT NULL DEFAULT 0,     -- For presence tracking

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (CRITICAL)
ALTER TABLE blocksuite_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy (following Phase 1-3 pattern)
CREATE POLICY "blocksuite_documents_team_access" ON blocksuite_documents
FOR ALL USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_blocksuite_docs_team ON blocksuite_documents(team_id);
CREATE INDEX idx_blocksuite_docs_workspace ON blocksuite_documents(workspace_id);
CREATE INDEX idx_blocksuite_docs_mind_map ON blocksuite_documents(mind_map_id);
CREATE INDEX idx_blocksuite_docs_size ON blocksuite_documents(storage_size_bytes)
  WHERE storage_size_bytes > 102400;  -- Monitor docs > 100KB

-- Comments
COMMENT ON TABLE blocksuite_documents IS
  'Metadata for BlockSuite documents. Yjs binary state stored in Supabase Storage for scalability.';
COMMENT ON COLUMN blocksuite_documents.storage_path IS
  'Supabase Storage path. Format: {team_id}/{doc_id}.yjs';
COMMENT ON COLUMN blocksuite_documents.storage_size_bytes IS
  'Size of Yjs state in bytes. Monitor for large documents (>100KB threshold).';
COMMENT ON COLUMN blocksuite_documents.sync_version IS
  'Optimistic concurrency version. Incremented on each save.';
