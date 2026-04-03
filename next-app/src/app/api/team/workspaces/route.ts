import { createClient } from '@/lib/supabase/server'
import { resolveActiveTeam } from '@/lib/teams/active-team'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/team/workspaces
 * Fetch all workspaces for the requested or active team
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get team_id from query params
    const searchParams = request.nextUrl.searchParams
    const requestedTeamId = searchParams.get('team_id')
    const { activeTeamId } = await resolveActiveTeam(supabase, user.id)
    const teamId = requestedTeamId || activeTeamId

    if (!teamId) {
      return NextResponse.json({ error: 'No active team found' }, { status: 404 })
    }

    // Verify user is a member of this team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 })
    }

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
  } catch (error) {
    console.error('Error in GET /api/team/workspaces:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
