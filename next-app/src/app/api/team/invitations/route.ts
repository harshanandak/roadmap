import { NextRequest, NextResponse } from 'next/server'
import { sendTeamInvitationEmail } from '@/lib/email/team-invitations'
import { requireTeamRouteContext } from '@/lib/api/team-route'
import { z } from 'zod'
import { randomBytes } from 'crypto'

// Validation schema for creating invitations
// Updated 2025-12-13: Migrated to 4-phase system
const createInvitationSchema = z.object({
  team_id: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'member']),
  phase_assignments: z.array(z.object({
    workspace_id: z.string(),
    phase: z.enum(['design', 'build', 'refine', 'launch']),
    can_edit: z.boolean()
  })).optional()
})

// Generate secure invitation token
function generateInvitationToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * GET /api/team/invitations?team_id=xxx
 * List all pending invitations for the requested or active team
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
    const { supabase, teamId, user } = teamContext.context

    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this team', success: false },
        { status: 403 }
      )
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can view invitations', success: false },
        { status: 403 }
      )
    }

    // Get all pending invitations for the team
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select(`
        *,
        invited_by:users!invitations_invited_by_fkey(id, email)
      `)
      .eq('team_id', teamId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
      return NextResponse.json(
        { error: 'Failed to fetch invitations', details: invitationsError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: invitations,
      success: true
    })

  } catch (error) {
    console.error('Error in GET /api/team/invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}

/**
 * POST /api/team/invitations
 * Create new invitation with phase assignments
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = createInvitationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues, success: false },
        { status: 400 }
      )
    }

    const { team_id, email, role, phase_assignments } = validation.data
    const teamContext = await requireTeamRouteContext({
      requestedTeamId: team_id,
      teamMissingMessage: 'No active team found',
    })
    if (!teamContext.ok) {
      return teamContext.response
    }
    const { supabase, user } = teamContext.context

    // Check if user is owner or admin of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this team', success: false },
        { status: 403 }
      )
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can invite members', success: false },
        { status: 403 }
      )
    }

    // Check if email is already a member
    const { data: existingMember, error: existingMemberError } = await supabase
      .from('team_members')
      .select('id, users!inner(email)')
      .eq('team_id', team_id)
      .eq('users.email', email)
      .maybeSingle()

    if (existingMemberError) {
      console.error('Error checking existing member:', existingMemberError)
      return NextResponse.json(
        { error: 'Failed to check existing members', details: existingMemberError.message, success: false },
        { status: 500 }
      )
    }

    if (existingMember) {
      return NextResponse.json(
        { error: 'This email is already a member of the team', success: false },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation, error: existingInvitationError } = await supabase
      .from('invitations')
      .select('id')
      .eq('team_id', team_id)
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existingInvitationError) {
      console.error('Error checking existing invitation:', existingInvitationError)
      return NextResponse.json(
        { error: 'Failed to check existing invitations', details: existingInvitationError.message, success: false },
        { status: 500 }
      )
    }

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email', success: false },
        { status: 400 }
      )
    }

    // Validate workspaces exist if phase_assignments provided
    if (phase_assignments && phase_assignments.length > 0) {
      const workspace_ids = [...new Set(phase_assignments.map(pa => pa.workspace_id))]

      const { data: workspaces, error: workspacesError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('team_id', team_id)
        .in('id', workspace_ids)

      if (workspacesError) {
        console.error('Error validating workspaces:', workspacesError)
        return NextResponse.json(
          { error: 'Failed to validate workspaces', details: workspacesError.message, success: false },
          { status: 500 }
        )
      }

      if (workspaces.length !== workspace_ids.length) {
        return NextResponse.json(
          { error: 'One or more workspaces are invalid', success: false },
          { status: 400 }
        )
      }
    }

    // Generate invitation token
    const token = generateInvitationToken()
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + 7) // 7 days from now

    // Create invitation with timestamp-based ID
    const invitationId = Date.now().toString()
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        id: invitationId,
        team_id,
        email,
        role,
        token,
        invited_by: user.id,
        expires_at: expires_at.toISOString(),
        phase_assignments: phase_assignments || []
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return NextResponse.json(
        { error: 'Failed to create invitation', details: invitationError.message, success: false },
        { status: 500 }
      )
    }

    // Send invitation email directly from this server flow
    try {
      const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', team_id)
        .single()

      await sendTeamInvitationEmail({
        email,
        expiresAt: expires_at.toISOString(),
        invitationToken: token,
        inviterEmail: user.email || null,
        inviterName:
          typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : null,
        role,
        teamName: team?.name || 'Your team',
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
    }

    return NextResponse.json({
      data: invitation,
      success: true
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/team/invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}
