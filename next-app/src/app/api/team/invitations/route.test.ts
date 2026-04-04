import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireTeamRouteContextMock = vi.fn()

vi.mock('@/lib/api/team-route', () => ({
  requireTeamRouteContext: requireTeamRouteContextMock,
}))

vi.mock('@/lib/email/team-invitations', () => ({
  sendTeamInvitationEmail: vi.fn(),
}))

describe('GET /api/team/invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 for non-admin members before invitation reads hit RLS', async () => {
    const membershipQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'member' },
        error: null,
      }),
    }

    const fromMock = vi.fn((table: string) => {
      if (table === 'team_members') {
        return membershipQuery
      }

      throw new Error(`Unexpected table lookup: ${table}`)
    })

    requireTeamRouteContextMock.mockResolvedValue({
      ok: true,
      context: {
        supabase: { from: fromMock },
        teamId: 'team-1',
        user: { id: 'user-1' },
      },
    })

    const { GET } = await import('./route')
    const request = new NextRequest('http://localhost/api/team/invitations')

    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload).toEqual({
      error: 'Only owners and admins can view invitations',
      success: false,
    })
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledWith('team_members')
  })
})
