import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const resolveActiveTeamMock = vi.fn()
const setActiveTeamCookieMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/teams/active-team', () => ({
  resolveActiveTeam: resolveActiveTeamMock,
  setActiveTeamCookie: setActiveTeamCookieMock,
}))

describe('POST /api/user/active-team', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for malformed bodies', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    })

    const { POST } = await import('./route')
    const request = new NextRequest('http://localhost/api/user/active-team', {
      method: 'POST',
      body: JSON.stringify({ teamId: 123 }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload).toEqual({ error: 'teamId is required', success: false })
    expect(setActiveTeamCookieMock).not.toHaveBeenCalled()
  })

  it('sets the active-team cookie for valid memberships', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    })
    resolveActiveTeamMock.mockResolvedValue({
      memberships: [{ team_id: 'team-1' }],
    })

    const { POST } = await import('./route')
    const request = new NextRequest('http://localhost/api/user/active-team', {
      method: 'POST',
      body: JSON.stringify({ teamId: 'team-1' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ activeTeamId: 'team-1', success: true })
    expect(setActiveTeamCookieMock).toHaveBeenCalledWith(expect.any(Response), 'team-1')
  })
})
