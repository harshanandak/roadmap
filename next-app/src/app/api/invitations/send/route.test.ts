import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/email/team-invitations', () => ({
  sendTeamInvitationEmail: vi.fn(),
}))

describe('POST /api/invitations/send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns success false when neither invitationId nor token is provided', async () => {
    const { POST } = await import('./route')
    const request = new NextRequest('http://localhost/api/invitations/send', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload).toEqual({
      error: 'Invitation ID or token is required',
      success: false,
    })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('returns success false when the caller is unauthenticated', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    })

    const { POST } = await import('./route')
    const request = new NextRequest('http://localhost/api/invitations/send', {
      method: 'POST',
      body: JSON.stringify({ invitationId: 'invite-1' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload).toEqual({
      error: 'Unauthorized',
      success: false,
    })
  })
})
