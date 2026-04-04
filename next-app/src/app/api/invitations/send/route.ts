import { NextRequest, NextResponse } from 'next/server'
import { sendTeamInvitationEmail } from '@/lib/email/team-invitations'
import { requireTeamRouteContext } from '@/lib/api/team-route'

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

    const teamContext = await requireTeamRouteContext()
    if (!teamContext.ok) {
      return teamContext.response
    }
    const { supabase, teamId } = teamContext.context

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
      .eq('team_id', teamId)

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
