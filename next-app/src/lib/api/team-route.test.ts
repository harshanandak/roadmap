import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const resolveActiveTeamMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/teams/active-team', () => ({
  resolveActiveTeam: resolveActiveTeamMock,
}))

describe('team-route helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns success false on unauthorized team context errors', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    })

    const { requireTeamRouteContext } = await import('./team-route')
    const result = await requireTeamRouteContext()

    expect(result.ok).toBe(false)
    if (result.ok) {
      throw new Error('Expected unauthorized result')
    }

    expect(result.response.status).toBe(401)
    await expect(result.response.json()).resolves.toEqual({
      error: 'Unauthorized',
      success: false,
    })
  })

  it('returns success false for missing workspace scope', async () => {
    const { requireWorkspaceScope } = await import('./team-route')
    const response = requireWorkspaceScope('workspace', null)

    expect(response?.status).toBe(400)
    await expect(response?.json()).resolves.toEqual({
      error: 'workspace_id is required for workspace scope',
      success: false,
    })
  })

  it('returns 400 for empty requested team ids', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1' },
          },
          error: null,
        }),
      },
    })
    resolveActiveTeamMock.mockResolvedValue({ activeTeamId: 'team-1' })

    const { requireTeamRouteContext } = await import('./team-route')
    const result = await requireTeamRouteContext({ requestedTeamId: '' })

    expect(result.ok).toBe(false)
    if (result.ok) {
      throw new Error('Expected empty team id to be rejected')
    }

    expect(result.response.status).toBe(400)
    await expect(result.response.json()).resolves.toEqual({
      error: 'team_id is required',
      success: false,
    })
  })
})
