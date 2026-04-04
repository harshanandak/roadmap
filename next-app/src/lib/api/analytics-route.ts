import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTeamRouteContext, requireWorkspaceScope } from '@/lib/api/team-route'

interface AnalyticsRouteOptions {
  includeDateRange?: boolean
}

interface AnalyticsRouteContext {
  from: string | null
  scope: string
  searchParams: URLSearchParams
  supabase: Awaited<ReturnType<typeof createClient>>
  teamId: string
  to: string | null
  workspaceId: string | null
}

type AnalyticsRouteResult =
  | { ok: true; context: AnalyticsRouteContext }
  | { ok: false; response: NextResponse }

export async function requireAnalyticsRouteContext(
  req: NextRequest,
  options: Readonly<AnalyticsRouteOptions> = {}
): Promise<AnalyticsRouteResult> {
  const { includeDateRange = false } = options
  const { searchParams } = new URL(req.url)

  const workspaceId = searchParams.get('workspace_id')
  const requestedTeamId = searchParams.get('team_id')
  const scope = searchParams.get('scope') || 'workspace'
  const from = includeDateRange ? searchParams.get('from') : null
  const to = includeDateRange ? searchParams.get('to') : null

  const workspaceScopeError = requireWorkspaceScope(scope, workspaceId)
  if (workspaceScopeError) {
    return { ok: false, response: workspaceScopeError }
  }

  const teamContext = await requireTeamRouteContext({ requestedTeamId })
  if (!teamContext.ok) {
    return { ok: false, response: teamContext.response }
  }

  return {
    ok: true,
    context: {
      from,
      scope,
      searchParams,
      supabase: teamContext.context.supabase,
      teamId: teamContext.context.teamId,
      to,
      workspaceId,
    },
  }
}
