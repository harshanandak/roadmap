import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveTeam } from '@/lib/teams/active-team'

interface TeamRouteOptions {
  notMemberMessage?: string
  requestedTeamId?: string | null
  teamMissingMessage?: string
  verifyMembership?: boolean
}

interface TeamRouteContext {
  supabase: Awaited<ReturnType<typeof createClient>>
  teamId: string
  user: NonNullable<Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>['auth']['getUser']>>['data']['user']>
}

type TeamRouteResult =
  | { ok: true; context: TeamRouteContext }
  | { ok: false; response: NextResponse }

export async function requireTeamRouteContext(
  options: Readonly<TeamRouteOptions> = {}
): Promise<TeamRouteResult> {
  const {
    notMemberMessage = 'Not a team member',
    requestedTeamId,
    teamMissingMessage = 'Team not found',
    verifyMembership = true,
  } = options

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 }),
    }
  }

  const { activeTeamId } = await resolveActiveTeam(supabase, user.id)
  const teamId = requestedTeamId || activeTeamId

  if (!teamId) {
    return {
      ok: false,
      response: NextResponse.json({ error: teamMissingMessage, success: false }, { status: 404 }),
    }
  }

  if (verifyMembership) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return {
        ok: false,
        response: NextResponse.json({ error: notMemberMessage, success: false }, { status: 403 }),
      }
    }
  }

  return {
    ok: true,
    context: {
      supabase,
      teamId,
      user,
    },
  }
}

export function requireWorkspaceScope(
  scope: string,
  workspaceId: string | null,
  message: string = 'workspace_id is required for workspace scope'
) {
  if (scope === 'workspace' && !workspaceId) {
    return NextResponse.json({ error: message, success: false }, { status: 400 })
  }

  return null
}
