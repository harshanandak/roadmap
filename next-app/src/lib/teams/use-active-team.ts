'use client'

import { useQuery } from '@tanstack/react-query'
import type { TeamRole } from '@/lib/types/team'

export interface ActiveTeamMembership {
  joined_at: string
  role: TeamRole
  team_id: string
}

interface ActiveTeamResponse {
  activeTeamId: string | null
  memberships: ActiveTeamMembership[]
}

async function fetchActiveTeam(): Promise<ActiveTeamResponse> {
  const response = await fetch('/api/user/active-team')

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(payload?.error || 'Failed to resolve active team')
  }

  return response.json() as Promise<ActiveTeamResponse>
}

export function useActiveTeam() {
  const query = useQuery({
    queryKey: ['active-team'],
    queryFn: fetchActiveTeam,
  })

  const activeMembership =
    query.data?.memberships.find(
      (membership) => membership.team_id === query.data?.activeTeamId
    ) || null

  return {
    ...query,
    activeMembership,
    activeTeamId: query.data?.activeTeamId || null,
    memberships: query.data?.memberships || [],
  }
}
