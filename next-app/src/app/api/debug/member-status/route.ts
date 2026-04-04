import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateInternalToolApiAccess } from '@/lib/internal-tools'
import { resolveActiveTeam } from '@/lib/teams/active-team'

export async function GET(request: NextRequest) {
  try {
    const access = await validateInternalToolApiAccess()
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const supabase = await createClient()

    // Get email from query params
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    const { activeTeamId, memberships } = await resolveActiveTeam(supabase, access.user.id)

    if (!activeTeamId) {
      return NextResponse.json({ error: 'User not in any team', success: false }, { status: 403 })
    }

    const activeMembership = memberships.find((membership) => membership.team_id === activeTeamId)
    const teamId = activeTeamId

    // Check invitations for this email in the user's team
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('email', email)
      .order('created_at', { ascending: false })

    // Check team_members for this team
    const { data: teamMembers, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)

    // Since we don't have a public.users table, we can't easily get emails
    // Just return the raw data for now
    const _memberWithEmail = null  // Will check manually in the UI

    // Check phase assignments if member exists
    const _phaseAssignments = null
    // Note: This code is disabled because memberWithEmail is null
    // if (memberWithEmail) {
    //   const { data: assignments } = await supabase
    //     .from('user_phase_assignments')
    //     .select('*')
    //     .eq('user_id', memberWithEmail.user_id)
    // }

    return NextResponse.json({
      email,
      teamId,
      currentUserRole: activeMembership?.role || null,
      invitations: invitations || [],
      teamMembers: teamMembers || [],
      note: "Team members show user_id instead of email because there's no public.users table",
      errors: {
        invError: invError?.message,
        memberError: memberError?.message,
      },
      success: true,
    })
  } catch (error: unknown) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', success: false },
      { status: 500 }
    )
  }
}
