import { NextRequest, NextResponse } from 'next/server'
import { sendTeamInvitationEmail } from '@/lib/email/team-invitations'
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
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated', success: false }, { status: 401 })
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

    const { data: invitation, error: inviteError } = invitationId
      ? await invitationQuery.eq('id', invitationId).single()
      : await invitationQuery.eq('token', token).single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found', success: false },
        { status: 404 }
      )
    }

    const invitationData = invitation as InvitationEmailLookup

    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', invitationData.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Permission denied', success: false },
        { status: 403 }
      )
    }

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
