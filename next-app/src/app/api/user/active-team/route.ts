import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveTeam, setActiveTeamCookie } from '@/lib/teams/active-team'
import { z } from 'zod'

const setActiveTeamSchema = z.object({
  teamId: z.string().min(1, 'teamId must be a non-empty string'),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
    }

    const { activeTeamId, memberships } = await resolveActiveTeam(supabase, user.id)

    return NextResponse.json({
      activeTeamId,
      memberships,
      success: true,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/user/active-team:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', success: false },
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
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
    }

    const rawBody = await request.json()
    const parsedBody = setActiveTeamSchema.safeParse(rawBody)

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'teamId is required', success: false }, { status: 400 })
    }
    const { teamId } = parsedBody.data

    const { memberships } = await resolveActiveTeam(supabase, user.id)
    const hasMembership = memberships.some((membership) => membership.team_id === teamId)

    if (!hasMembership) {
      return NextResponse.json({ error: 'Forbidden', success: false }, { status: 403 })
    }

    const response = NextResponse.json({ activeTeamId: teamId, success: true })
    setActiveTeamCookie(response, teamId)
    return response
  } catch (error: unknown) {
    console.error('Error in POST /api/user/active-team:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', success: false },
      { status: 500 }
    )
  }
}
