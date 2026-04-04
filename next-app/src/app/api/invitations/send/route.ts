import { NextRequest, NextResponse } from 'next/server'
import { sendTeamInvitationEmail } from '@/lib/email/team-invitations'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface InvitationEmailLookup {
  email: string
  expires_at: string
  role: string
  team_id: string
  token: string
  teams: { name: string } | { name: string }[] | null
  inviter:
    | {
        email: string | null
        name: string | null
      }
    | Array<{
        email: string | null
        name: string | null
      }>
    | null
}

interface InvitationReference {
  id: string
  team_id: string
}

export async function POST(request: NextRequest) {
  try {
    const { invitationId, token } = await request.json()

    if (!invitationId && !token) {
      return NextResponse.json(
        { error: 'Invitation ID or token is required', success: false },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const adminSupabase = createAdminClient()

    const invitationReferenceQuery = adminSupabase
      .from('invitations')
      .select('id, team_id')

    const { data: invitationReference, error: referenceError } = invitationId
      ? await invitationReferenceQuery.eq('id', invitationId).maybeSingle()
      : await invitationReferenceQuery.eq('token', token).maybeSingle()

    if (referenceError || !invitationReference) {
      return NextResponse.json(
        { error: 'Invitation not found', success: false },
        { status: 404 }
      )
    }

    const invitationRef = invitationReference as InvitationReference

    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', invitationRef.team_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError) {
      console.error('Error checking invitation resend permissions:', membershipError)
      return NextResponse.json(
        { error: 'Failed to verify invitation permissions', success: false },
        { status: 500 }
      )
    }

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can resend invitations', success: false },
        { status: 403 }
      )
    }

    const invitationQuery = supabase
      .from('invitations')
      .select(
        `
        email,
        expires_at,
        role,
        team_id,
        token,
        teams:team_id(name),
        inviter:users!invitations_invited_by_fkey(name, email)
      `
      )
      .eq('team_id', invitationRef.team_id)

    const { data: invitation, error: inviteError } = invitationId
      ? await invitationQuery.eq('id', invitationId).maybeSingle()
      : await invitationQuery.eq('token', token).maybeSingle()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found', success: false },
        { status: 404 }
      )
    }

    const invitationData = invitation as InvitationEmailLookup

    const team = Array.isArray(invitationData.teams) ? invitationData.teams[0] : invitationData.teams
    const inviter = Array.isArray(invitationData.inviter) ? invitationData.inviter[0] : invitationData.inviter

    const emailInfo = await sendTeamInvitationEmail({
      email: invitationData.email,
      expiresAt: invitationData.expires_at,
      invitationToken: invitationData.token,
      inviterEmail: inviter?.email || null,
      inviterName: inviter?.name || null,
      role: invitationData.role,
      teamName: team?.name || 'Your team',
    })

    return NextResponse.json({
      success: true,
      messageId: emailInfo.messageId,
    })
  } catch (error: unknown) {
    console.error('Error sending invitation:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    )
  }
}
