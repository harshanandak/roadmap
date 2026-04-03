import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_TEAM_COOKIE, resolveActiveTeam } from '@/lib/teams/active-team'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activeTeamId, memberships } = await resolveActiveTeam(supabase, user.id)

    return NextResponse.json({
      activeTeamId,
      memberships,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/user/active-team:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await request.json() as { teamId?: string }

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    }

    const { memberships } = await resolveActiveTeam(supabase, user.id)
    const hasMembership = memberships.some((membership) => membership.team_id === teamId)

    if (!hasMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_TEAM_COOKIE, teamId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    })

    return NextResponse.json({ activeTeamId: teamId })
  } catch (error: unknown) {
    console.error('Error in POST /api/user/active-team:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
