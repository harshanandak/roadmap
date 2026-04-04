import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { setActiveTeamCookie } from '@/lib/teams/active-team'
import { z } from 'zod'

interface InvitationLookupRow {
  accepted_at: string | null
  email: string
  expires_at: string
  invitation_id: string
  invited_by: string | null
  phase_assignments: Array<{
    workspace_id: string
    phase: string
    can_edit?: boolean
    notes?: string | null
  }> | null
  role: string
  team_id: string
}

// Validation schema for accepting invitations
const acceptInvitationSchema = z.object({
  token: z.string()
})

/**
 * POST /api/team/invitations/accept
 * Accept invitation and join team
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = acceptInvitationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues, success: false },
        { status: 400 }
      )
    }

    const { token } = validation.data

    const { data: invitation, error: invitationError } = await supabase
      .rpc('get_invitation_by_token', { p_token: token })
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token', success: false },
        { status: 404 }
      )
    }

    const invitationData = invitation as InvitationLookupRow

    // Check if invitation is already accepted
    if (invitationData.accepted_at) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted', success: false },
        { status: 400 }
      )
    }

    // Check if invitation is expired
    const now = new Date()
    const expiresAt = new Date(invitationData.expires_at)
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired', success: false },
        { status: 400 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'Authenticated user is missing an email address', success: false },
        { status: 500 }
      )
    }

    // Verify email matches (case-insensitive)
    if (user.email.toLowerCase() !== invitationData.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is for a different email address', success: false },
        { status: 403 }
      )
    }

    // Check if user is already a member of the team
    const { data: existingMember, error: existingMemberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', invitationData.team_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMemberError) {
      console.error('Error checking existing membership:', existingMemberError)
      return NextResponse.json(
        { error: 'Failed to check team membership', details: existingMemberError.message, success: false },
        { status: 500 }
      )
    }

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this team', success: false },
        { status: 400 }
      )
    }

    const userName =
      typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim().length > 0
        ? user.user_metadata.full_name.trim()
        : user.email.split('@')[0]

    const { error: profileError } = await adminSupabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email,
          name: userName,
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error('Error upserting user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to prepare user profile', details: profileError.message, success: false },
        { status: 500 }
      )
    }

    // Create team member record with timestamp-based ID
    const teamMemberId = Date.now().toString()
    const { data: teamMember, error: teamMemberError } = await adminSupabase
      .from('team_members')
      .insert({
        id: teamMemberId,
        team_id: invitationData.team_id,
        user_id: user.id,
        role: invitationData.role
      })
      .select()
      .single()

    if (teamMemberError) {
      console.error('Error creating team member:', teamMemberError)
      return NextResponse.json(
        { error: 'Failed to join team', details: teamMemberError.message, success: false },
        { status: 500 }
      )
    }

    // Create phase assignments if specified in invitation
    if (invitationData.phase_assignments && invitationData.phase_assignments.length > 0) {
      const phaseAssignments = invitationData.phase_assignments.map((assignment) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        workspace_id: assignment.workspace_id,
        user_id: user.id,
        phase: assignment.phase,
        can_edit: assignment.can_edit || false,
        notes: assignment.notes || null
      }))

      const { error: assignmentsError } = await adminSupabase
        .from('user_phase_assignments')
        .insert(phaseAssignments)

      if (assignmentsError) {
        console.error('Error creating phase assignments:', assignmentsError)
        // Don't fail the whole operation, just log the error
        // The user is still added to the team successfully
      }
    }

    // Mark invitation as accepted
    const { error: updateError } = await adminSupabase
      .from('invitations')
      .update({ accepted_at: now.toISOString() })
      .eq('id', invitationData.invitation_id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      // Don't fail the operation, the user is already added
    }

    // Get team details for response
    const { data: team, error: _teamError } = await adminSupabase
      .from('teams')
      .select('id, name')
      .eq('id', invitationData.team_id)
      .single()

    // Get first workspace for redirect (if any)
    const { data: workspaces } = await adminSupabase
      .from('workspaces')
      .select('id')
      .eq('team_id', invitationData.team_id)
      .limit(1)
      .single()

    const redirectUrl = workspaces
      ? `/workspaces/${workspaces.id}`
      : `/teams/${invitationData.team_id}`

    const response = NextResponse.json({
      data: {
        team_member: teamMember,
        team: team || { id: invitationData.team_id },
        redirect_url: redirectUrl,
        message: 'Successfully joined team'
      },
      success: true
    })

    setActiveTeamCookie(response, invitationData.team_id)
    return response

  } catch (error) {
    console.error('Error in POST /api/team/invitations/accept:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}
