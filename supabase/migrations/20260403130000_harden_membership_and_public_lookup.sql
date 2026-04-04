-- ============================================================================
-- Migration: Harden membership policies and public invitation lookup
-- Date: 2026-04-03
-- Purpose:
--   1. Remove accidental public/team-wide reads introduced by OR true policies
--   2. Prevent arbitrary self-join into team_members
--   3. Replace public invitation table access with a narrow token lookup function
--   4. Ensure SECURITY DEFINER team-scoped functions validate membership explicitly
-- ============================================================================

-- ============================================================================
-- TEAM MEMBERSHIP / TEAM / INVITATION POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can join teams or admins can add members" ON public.team_members;

CREATE POLICY "Team admins can add members" ON public.team_members
FOR INSERT
WITH CHECK (
  public.user_is_team_admin(team_id)
  OR (
    user_id = (SELECT auth.uid())
    AND role = 'owner'
    AND EXISTS (
      SELECT 1
      FROM public.teams
      WHERE public.teams.id = public.team_members.team_id
        AND public.teams.owner_id = (SELECT auth.uid())
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.team_members existing_members
      WHERE existing_members.team_id = public.team_members.team_id
    )
  )
);

DROP POLICY IF EXISTS "Users can view teams" ON public.teams;

CREATE POLICY "Users can view teams" ON public.teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE public.team_members.team_id = public.teams.id
      AND public.team_members.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can view invitations" ON public.invitations;

CREATE POLICY "Team admins can view invitations" ON public.invitations
FOR SELECT
USING (public.user_is_team_admin(team_id));

-- ============================================================================
-- PUBLIC INVITATION LOOKUP BY TOKEN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  invitation_id TEXT,
  team_id TEXT,
  email TEXT,
  role TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  phase_assignments JSONB,
  invited_by UUID,
  team_name TEXT,
  team_plan TEXT,
  inviter_name TEXT,
  inviter_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS invitation_id,
    i.team_id,
    i.email,
    i.role,
    i.expires_at,
    i.created_at,
    i.accepted_at,
    COALESCE(i.phase_assignments, '[]'::jsonb) AS phase_assignments,
    i.invited_by,
    t.name AS team_name,
    t.plan AS team_plan,
    u.name AS inviter_name,
    u.email AS inviter_email
  FROM public.invitations i
  JOIN public.teams t ON t.id = i.team_id
  LEFT JOIN public.users u ON u.id = i.invited_by
  WHERE i.token = p_token
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_invitation_by_token(TEXT) IS
  'Returns the minimal invitation payload needed for public invitation details and acceptance flows.';

-- ============================================================================
-- TEAM-SCOPED SECURITY DEFINER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assert_team_membership(p_team_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_is_team_member(p_team_id) THEN
    RAISE EXCEPTION 'Not authorized for team %', p_team_id USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_documents(
  p_team_id TEXT,
  p_query_embedding extensions.vector(1536),
  p_workspace_id TEXT DEFAULT NULL,
  p_collection_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id TEXT,
  document_id TEXT,
  document_name TEXT,
  content TEXT,
  similarity FLOAT,
  page_number INTEGER,
  heading TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_team_membership(p_team_id);

  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    dc.document_id,
    kd.name AS document_name,
    dc.content,
    1 - (dc.embedding <=> p_query_embedding) AS similarity,
    dc.page_number,
    dc.heading
  FROM public.document_chunks dc
  JOIN public.knowledge_documents kd ON dc.document_id = kd.id
  WHERE kd.team_id = p_team_id
    AND kd.status = 'ready'
    AND (p_workspace_id IS NULL OR kd.workspace_id = p_workspace_id)
    AND (p_collection_id IS NULL OR kd.collection_id = p_collection_id)
    AND 1 - (dc.embedding <=> p_query_embedding) >= p_threshold
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_knowledge_base_stats(p_team_id TEXT)
RETURNS TABLE (
  total_documents INTEGER,
  total_chunks INTEGER,
  total_queries INTEGER,
  documents_by_type JSONB,
  documents_by_status JSONB,
  recent_documents JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_team_membership(p_team_id);

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.knowledge_documents WHERE team_id = p_team_id),
    (
      SELECT COUNT(*)::INTEGER
      FROM public.document_chunks dc
      JOIN public.knowledge_documents kd ON dc.document_id = kd.id
      WHERE kd.team_id = p_team_id
    ),
    (SELECT COUNT(*)::INTEGER FROM public.document_queries WHERE team_id = p_team_id),
    (
      SELECT jsonb_object_agg(file_type, cnt)
      FROM (
        SELECT file_type, COUNT(*) AS cnt
        FROM public.knowledge_documents
        WHERE team_id = p_team_id
        GROUP BY file_type
      ) t
    ),
    (
      SELECT jsonb_object_agg(status, cnt)
      FROM (
        SELECT status, COUNT(*) AS cnt
        FROM public.knowledge_documents
        WHERE team_id = p_team_id
        GROUP BY status
      ) t
    ),
    (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT id, name, file_type, status, created_at
        FROM public.knowledge_documents
        WHERE team_id = p_team_id
        ORDER BY created_at DESC
        LIMIT 5
      ) t
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_team_integration_summary(p_team_id TEXT)
RETURNS TABLE (
  total_integrations INTEGER,
  connected_count INTEGER,
  error_count INTEGER,
  providers TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_team_membership(p_team_id);

  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_integrations,
    COUNT(*) FILTER (WHERE status = 'connected')::INTEGER AS connected_count,
    COUNT(*) FILTER (WHERE status IN ('error', 'expired'))::INTEGER AS error_count,
    ARRAY_AGG(DISTINCT provider) AS providers
  FROM public.organization_integrations
  WHERE team_id = p_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_resources(
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
  PERFORM public.assert_team_membership(p_team_id);

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
      FROM public.work_item_resources wir
      WHERE wir.resource_id = r.id
        AND wir.is_unlinked = FALSE
    ) AS linked_work_items_count
  FROM public.resources r
  WHERE r.team_id = p_team_id
    AND (p_workspace_id IS NULL OR r.workspace_id = p_workspace_id)
    AND (p_resource_type IS NULL OR r.resource_type = p_resource_type)
    AND (p_include_deleted OR r.is_deleted = FALSE)
    AND (p_query IS NULL OR p_query = '' OR r.search_vector @@ websearch_to_tsquery('english', p_query))
  ORDER BY
    CASE
      WHEN p_query IS NOT NULL AND p_query != '' THEN ts_rank(r.search_vector, websearch_to_tsquery('english', p_query))
      ELSE 0
    END DESC,
    r.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_resource_history(resource_id_param TEXT)
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
SET search_path = public
AS $$
DECLARE
  v_team_id TEXT;
BEGIN
  SELECT team_id
  INTO v_team_id
  FROM public.resources
  WHERE id = resource_id_param;

  IF v_team_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.user_is_team_member(v_team_id) THEN
    RAISE EXCEPTION 'Not authorized for resource %', resource_id_param USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    ral.action,
    ral.performed_at,
    ral.actor_id,
    ral.actor_email,
    ral.work_item_id,
    ral.changes
  FROM public.resource_audit_log ral
  WHERE ral.resource_id = resource_id_param
  ORDER BY ral.performed_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_compressed_context(
  p_team_id TEXT,
  p_query_embedding extensions.vector(1536),
  p_workspace_id TEXT DEFAULT NULL,
  p_max_tokens INTEGER DEFAULT 2000
)
RETURNS TABLE (
  layer TEXT,
  source_id TEXT,
  source_name TEXT,
  content TEXT,
  similarity FLOAT,
  token_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_team_membership(p_team_id);

  RETURN QUERY
  WITH combined AS (
    SELECT
      'L2' AS layer,
      ds.document_id AS source_id,
      kd.name AS source_name,
      ds.summary AS content,
      1 - (ds.embedding <=> p_query_embedding) AS similarity,
      ds.token_count
    FROM public.document_summaries ds
    JOIN public.knowledge_documents kd ON ds.document_id = kd.id
    WHERE kd.team_id = p_team_id
      AND (p_workspace_id IS NULL OR kd.workspace_id = p_workspace_id)
      AND ds.embedding IS NOT NULL

    UNION ALL

    SELECT
      'L3' AS layer,
      kt.id AS source_id,
      kt.name AS source_name,
      kt.summary AS content,
      1 - (kt.embedding <=> p_query_embedding) AS similarity,
      COALESCE(LENGTH(kt.summary) / 4, 100) AS token_count
    FROM public.knowledge_topics kt
    WHERE kt.team_id = p_team_id
      AND (p_workspace_id IS NULL OR kt.workspace_id = p_workspace_id)
      AND kt.embedding IS NOT NULL
      AND kt.summary IS NOT NULL

    UNION ALL

    SELECT
      'L4' AS layer,
      kc.id AS source_id,
      kc.name AS source_name,
      kc.description AS content,
      1 - (kc.embedding <=> p_query_embedding) AS similarity,
      COALESCE(LENGTH(kc.description) / 4, 50) AS token_count
    FROM public.knowledge_concepts kc
    WHERE kc.team_id = p_team_id
      AND (p_workspace_id IS NULL OR kc.workspace_id = p_workspace_id)
      AND kc.embedding IS NOT NULL
      AND kc.description IS NOT NULL
  ),
  ranked AS (
    SELECT *,
      SUM(token_count) OVER (ORDER BY similarity DESC) AS cumulative_tokens
    FROM combined
    WHERE similarity >= 0.6
  )
  SELECT
    ranked.layer,
    ranked.source_id,
    ranked.source_name,
    ranked.content,
    ranked.similarity,
    ranked.token_count
  FROM ranked
  WHERE cumulative_tokens <= LEAST(GREATEST(COALESCE(p_max_tokens, 2000), 100), 8000)
  ORDER BY similarity DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_knowledge_graph(
  p_team_id TEXT,
  p_workspace_id TEXT DEFAULT NULL,
  p_concept_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  concepts JSONB,
  relationships JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_team_membership(p_team_id);

  RETURN QUERY
  WITH top_concepts AS (
    SELECT id, name, concept_type, description, mention_count
    FROM public.knowledge_concepts
    WHERE team_id = p_team_id
      AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
    ORDER BY mention_count DESC, confidence_score DESC
    LIMIT LEAST(GREATEST(COALESCE(p_concept_limit, 50), 1), 200)
  ),
  relevant_relationships AS (
    SELECT
      cr.source_concept_id,
      cr.target_concept_id,
      cr.relationship_type,
      cr.strength
    FROM public.concept_relationships cr
    WHERE cr.source_concept_id IN (SELECT id FROM top_concepts)
      AND cr.target_concept_id IN (SELECT id FROM top_concepts)
  )
  SELECT
    (SELECT jsonb_agg(row_to_json(tc)) FROM top_concepts tc) AS concepts,
    (SELECT jsonb_agg(row_to_json(rr)) FROM relevant_relationships rr) AS relationships;
END;
$$;
