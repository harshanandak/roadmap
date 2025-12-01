-- ============================================================================
-- Migration: Create Resources Module
-- Date: 2025-11-30
-- Purpose: Inspiration & Resources tabs with global search, sharing, audit trail
-- Tables: resources, work_item_resources (junction), resource_audit_log
-- Features: Soft delete with 30-day recycle bin, full-text search, audit trail
-- ============================================================================

-- ============================================================================
-- TABLE 1: resources - Core resource storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.resources (
  -- Primary key (timestamp-based TEXT, not UUID)
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,

  -- Multi-tenant isolation (REQUIRED)
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Core fields
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  notes TEXT,

  -- Classification (5 types)
  resource_type TEXT NOT NULL DEFAULT 'reference' CHECK (resource_type IN (
    'reference',      -- General links, bookmarks, URLs
    'inspiration',    -- Competitor examples, design ideas, benchmarks
    'documentation',  -- Tutorials, guides, articles, specs
    'media',          -- Videos, images, screenshots
    'tool'            -- Tools, utilities, services
  )),

  -- Metadata
  image_url TEXT,
  favicon_url TEXT,
  source_domain TEXT,  -- Extracted from URL for grouping

  -- Full-text search (generated column with weighted fields)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(notes, '')), 'C')
  ) STORED,

  -- Soft delete for 30-day recycle bin
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Audit columns
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Comments for documentation
COMMENT ON TABLE public.resources IS 'Reusable resources (URLs, references, docs) that can be shared across work items';
COMMENT ON COLUMN public.resources.resource_type IS 'Type: reference, inspiration, documentation, media, tool';
COMMENT ON COLUMN public.resources.search_vector IS 'Generated tsvector for full-text search with weighted fields (title=A, description=B, notes=C)';
COMMENT ON COLUMN public.resources.is_deleted IS 'Soft delete flag - items auto-purge after 30 days';

-- ============================================================================
-- TABLE 2: work_item_resources - Junction table (many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_item_resources (
  -- Composite primary key
  work_item_id TEXT NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  PRIMARY KEY (work_item_id, resource_id),

  -- Multi-tenant (denormalized for RLS performance)
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Link metadata
  tab_type TEXT NOT NULL DEFAULT 'resource' CHECK (tab_type IN ('inspiration', 'resource')),
  display_order INTEGER NOT NULL DEFAULT 0,
  context_note TEXT,  -- Why this resource is relevant to THIS work item

  -- Audit for link itself
  added_by UUID NOT NULL REFERENCES public.users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft unlink (for audit trail)
  is_unlinked BOOLEAN NOT NULL DEFAULT FALSE,
  unlinked_at TIMESTAMPTZ,
  unlinked_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.work_item_resources IS 'Junction table linking resources to work items (many-to-many with audit)';
COMMENT ON COLUMN public.work_item_resources.tab_type IS 'Which tab to display under: inspiration or resource';
COMMENT ON COLUMN public.work_item_resources.context_note IS 'User note explaining relevance to this specific work item';

-- ============================================================================
-- TABLE 3: resource_audit_log - History tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.resource_audit_log (
  -- Primary key
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT || '_' || floor(random() * 1000)::TEXT,

  -- What changed
  resource_id TEXT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  work_item_id TEXT,  -- For link/unlink actions

  -- Action type
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'deleted', 'restored',
    'linked', 'unlinked'
  )),

  -- Who and when
  actor_id UUID NOT NULL REFERENCES public.users(id),
  actor_email TEXT,  -- Denormalized for compliance (survives user deletion)
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Change details
  changes JSONB,  -- { field: { old: value, new: value } }

  -- Context
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.resource_audit_log IS 'Immutable audit trail for all resource operations';
COMMENT ON COLUMN public.resource_audit_log.actor_email IS 'Denormalized email for compliance - survives user account deletion';
COMMENT ON COLUMN public.resource_audit_log.changes IS 'JSONB object with field changes: { fieldName: { old: x, new: y } }';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Resources: Full-text search (GIN index for fast search)
CREATE INDEX IF NOT EXISTS idx_resources_search_vector
  ON public.resources USING GIN(search_vector);

-- Resources: Active items only (partial index)
CREATE INDEX IF NOT EXISTS idx_resources_active
  ON public.resources(team_id, workspace_id)
  WHERE is_deleted = FALSE;

-- Resources: Deleted items for trash view
CREATE INDEX IF NOT EXISTS idx_resources_deleted
  ON public.resources(team_id, deleted_at)
  WHERE is_deleted = TRUE;

-- Resources: Type filtering
CREATE INDEX IF NOT EXISTS idx_resources_type
  ON public.resources(resource_type);

-- Resources: Domain grouping
CREATE INDEX IF NOT EXISTS idx_resources_domain
  ON public.resources(source_domain)
  WHERE source_domain IS NOT NULL;

-- Resources: Team + workspace lookup
CREATE INDEX IF NOT EXISTS idx_resources_team_workspace
  ON public.resources(team_id, workspace_id);

-- Junction: Resource lookup
CREATE INDEX IF NOT EXISTS idx_wir_resource
  ON public.work_item_resources(resource_id);

-- Junction: Tab filtering (active links only)
CREATE INDEX IF NOT EXISTS idx_wir_tab
  ON public.work_item_resources(work_item_id, tab_type)
  WHERE is_unlinked = FALSE;

-- Junction: Team lookup
CREATE INDEX IF NOT EXISTS idx_wir_team
  ON public.work_item_resources(team_id);

-- Audit: Resource history
CREATE INDEX IF NOT EXISTS idx_audit_resource
  ON public.resource_audit_log(resource_id, performed_at DESC);

-- Audit: Actor history
CREATE INDEX IF NOT EXISTS idx_audit_actor
  ON public.resource_audit_log(actor_id, performed_at DESC);

-- Audit: Work item history (for link/unlink events)
CREATE INDEX IF NOT EXISTS idx_audit_work_item
  ON public.resource_audit_log(work_item_id, performed_at DESC)
  WHERE work_item_id IS NOT NULL;

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

-- Trigger function already exists from previous migrations
-- Just create the trigger for resources table

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY: Team-based access control
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_item_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: resources table
-- ============================================================================

-- SELECT: Team members can view resources (including deleted for trash view)
CREATE POLICY "Team members can view resources"
  ON public.resources FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Team members can create resources
CREATE POLICY "Team members can create resources"
  ON public.resources FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Team members can update resources in their team
CREATE POLICY "Team members can update resources"
  ON public.resources FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- DELETE: Only creator or admin/owner can hard delete
CREATE POLICY "Creator or admin can delete resources"
  ON public.resources FOR DELETE
  USING (
    created_by = auth.uid()
    OR team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: work_item_resources table
-- ============================================================================

-- SELECT: Team members can view resource links
CREATE POLICY "Team members can view work item resources"
  ON public.work_item_resources FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Team members can link resources
CREATE POLICY "Team members can link resources"
  ON public.work_item_resources FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Team members can update links (for soft unlink)
CREATE POLICY "Team members can update resource links"
  ON public.work_item_resources FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- DELETE: Team members can hard delete links
CREATE POLICY "Team members can delete resource links"
  ON public.work_item_resources FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: resource_audit_log table (read-only for users)
-- ============================================================================

-- SELECT: Team members can view audit log
CREATE POLICY "Team members can view resource audit log"
  ON public.resource_audit_log FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Allow inserts (for triggers and API)
CREATE POLICY "Allow audit log inserts"
  ON public.resource_audit_log FOR INSERT
  WITH CHECK (TRUE);

-- No UPDATE or DELETE policies - audit log is immutable

-- ============================================================================
-- FUNCTION: Generic soft-delete purge (reusable for future entities)
-- ============================================================================

CREATE OR REPLACE FUNCTION purge_soft_deleted(
  table_name TEXT,
  days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  query TEXT;
BEGIN
  -- Build dynamic query to delete old soft-deleted items
  query := format(
    'DELETE FROM public.%I WHERE is_deleted = TRUE AND deleted_at < NOW() - interval ''%s days''',
    table_name,
    days
  );

  EXECUTE query;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION purge_soft_deleted IS 'Generic function to permanently delete soft-deleted items older than N days. Usage: SELECT purge_soft_deleted(''resources'', 30)';

-- ============================================================================
-- FUNCTION: Resource-specific purge (for Edge Function convenience)
-- ============================================================================

CREATE OR REPLACE FUNCTION purge_deleted_resources(days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN purge_soft_deleted('resources', days);
END;
$$;

-- ============================================================================
-- FUNCTION: Full-text search with ranking
-- ============================================================================

CREATE OR REPLACE FUNCTION search_resources(
  p_team_id TEXT,
  p_query TEXT,
  p_workspace_id TEXT DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_include_deleted BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  url TEXT,
  description TEXT,
  notes TEXT,
  resource_type TEXT,
  image_url TEXT,
  source_domain TEXT,
  is_deleted BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ,
  search_rank REAL,
  linked_work_items_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.url,
    r.description,
    r.notes,
    r.resource_type,
    r.image_url,
    r.source_domain,
    r.is_deleted,
    r.created_by,
    r.created_at,
    ts_rank(r.search_vector, websearch_to_tsquery('english', p_query)) AS search_rank,
    (
      SELECT COUNT(*)
      FROM work_item_resources wir
      WHERE wir.resource_id = r.id AND wir.is_unlinked = FALSE
    ) AS linked_work_items_count
  FROM resources r
  WHERE r.team_id = p_team_id
    AND (p_workspace_id IS NULL OR r.workspace_id = p_workspace_id)
    AND (p_resource_type IS NULL OR r.resource_type = p_resource_type)
    AND (p_include_deleted OR r.is_deleted = FALSE)
    AND (p_query IS NULL OR p_query = '' OR r.search_vector @@ websearch_to_tsquery('english', p_query))
  ORDER BY
    CASE WHEN p_query IS NOT NULL AND p_query != ''
      THEN ts_rank(r.search_vector, websearch_to_tsquery('english', p_query))
      ELSE 0
    END DESC,
    r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION search_resources IS 'Full-text search across resources with ranking, filtering, and pagination';

-- ============================================================================
-- FUNCTION: Get resource history
-- ============================================================================

CREATE OR REPLACE FUNCTION get_resource_history(resource_id_param TEXT)
RETURNS TABLE (
  action TEXT,
  performed_at TIMESTAMPTZ,
  actor_id UUID,
  actor_email TEXT,
  work_item_id TEXT,
  changes JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ral.action,
    ral.performed_at,
    ral.actor_id,
    ral.actor_email,
    ral.work_item_id,
    ral.changes
  FROM resource_audit_log ral
  WHERE ral.resource_id = resource_id_param
  ORDER BY ral.performed_at DESC;
END;
$$;

COMMENT ON FUNCTION get_resource_history IS 'Get complete audit trail for a resource';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
