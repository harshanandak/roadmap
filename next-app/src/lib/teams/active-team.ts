import 'server-only'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export const ACTIVE_TEAM_COOKIE = 'active_team_id'

export function setActiveTeamCookie(response: NextResponse, teamId: string) {
  response.cookies.set(ACTIVE_TEAM_COOKIE, teamId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export interface TeamMembership {
  joined_at: string
  role: string
  team_id: string
}

export async function getTeamMemberships(
  supabase: SupabaseClient,
  userId: string
): Promise<TeamMembership[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, role, joined_at')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

export async function resolveActiveTeam(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  activeTeamId: string | null
  memberships: TeamMembership[]
}> {
  const memberships = await getTeamMemberships(supabase, userId)

  if (memberships.length === 0) {
    return { activeTeamId: null, memberships }
  }

  const cookieStore = await cookies()
  const preferredTeamId = cookieStore.get(ACTIVE_TEAM_COOKIE)?.value

  const activeMembership =
    memberships.find((membership) => membership.team_id === preferredTeamId) || memberships[0]

  return {
    activeTeamId: activeMembership.team_id,
    memberships,
  }
}
