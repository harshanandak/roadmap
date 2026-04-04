import { NextRequest, NextResponse } from 'next/server'
import { requireTeamRouteContext } from '@/lib/api/team-route'

/**
 * GET /api/team/members?team_id=xxx
 * List all team members with their phase assignments for the requested or active team
 */
export async function GET(request: NextRequest) {
  try {
    // Get team_id from query params
    const searchParams = request.nextUrl.searchParams
    const requestedTeamId = searchParams.get('team_id')
    const teamContext = await requireTeamRouteContext({
      notMemberMessage: 'You are not a member of this team',
      requestedTeamId,
      teamMissingMessage: 'No active team found',
    })
    if (!teamContext.ok) {
      return teamContext.response
    }
    const { supabase, teamId } = teamContext.context

    // Get all team members with user details
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        users:users!team_members_user_id_fkey(
          id,
          email,
          name,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members', details: membersError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: members,
      success: true
    })

  } catch (error) {
    console.error('Error in GET /api/team/members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}
