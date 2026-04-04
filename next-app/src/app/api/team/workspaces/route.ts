import { requireTeamRouteContext } from '@/lib/api/team-route'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/team/workspaces
 * Fetch all workspaces for the requested or active team
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requestedTeamId = searchParams.get('team_id')
    const teamContext = await requireTeamRouteContext({
      requestedTeamId,
      teamMissingMessage: 'No active team found',
    })
    if (!teamContext.ok) {
      return teamContext.response
    }
    const { supabase, teamId } = teamContext.context

    // Fetch all workspaces for this team
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('id, name, description, phase, created_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })

    if (workspacesError) {
      console.error('Error fetching workspaces:', workspacesError)
      return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
    }

    return NextResponse.json(workspaces || [])
  } catch (error: unknown) {
    console.error('Error in GET /api/team/workspaces:', error)
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 })
  }
}
