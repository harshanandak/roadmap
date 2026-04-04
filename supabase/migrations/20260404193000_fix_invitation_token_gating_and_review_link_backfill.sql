-- ============================================================================
-- Migration: Fix invitation token lookup grants/gating and backfill review link team scope
-- Date: 2026-04-04
-- Purpose:
--   1. Ensure public invitation lookup only returns active invitations
--   2. Add explicit EXECUTE grants for security definer functions introduced in 20260403130000
--   3. Backfill legacy review_links.team_id values from their workspace
-- ============================================================================

UPDATE public.review_links rl
SET team_id = w.team_id
FROM public.workspaces w
WHERE w.id = rl.workspace_id
  AND rl.team_id IS NULL;

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
    AND i.accepted_at IS NULL
    AND (i.expires_at IS NULL OR i.expires_at > NOW())
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.assert_team_membership(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_documents(TEXT, extensions.vector, TEXT, TEXT, INTEGER, FLOAT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_knowledge_base_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_integration_summary(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_resources(TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_resource_history(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_compressed_context(TEXT, extensions.vector, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_knowledge_graph(TEXT, TEXT, INTEGER) TO authenticated;
