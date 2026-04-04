import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/email/review-links', () => ({
  sendReviewLinkEmail: vi.fn(),
}))

describe('POST /api/review-links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes the workspace team_id onto new review links', async () => {
    const insertMock = vi.fn().mockReturnThis()
    const selectAfterInsertMock = vi.fn().mockReturnThis()
    const singleAfterInsertMock = vi.fn().mockResolvedValue({
      data: {
        id: 'link-1',
        team_id: 'team-1',
        workspace_id: 'workspace-1',
      },
      error: null,
    })

    const teamMembersQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'membership-1' },
        error: null,
      }),
    }

    const workspacesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { team_id: 'team-1', name: 'Workspace One' },
        error: null,
      }),
    }

    const reviewLinksQuery = {
      insert: insertMock,
      select: selectAfterInsertMock,
      single: singleAfterInsertMock,
    }

    const fromMock = vi.fn((table: string) => {
      if (table === 'workspaces') return workspacesQuery
      if (table === 'team_members') return teamMembersQuery
      if (table === 'review_links') return reviewLinksQuery

      throw new Error(`Unexpected table lookup: ${table}`)
    })

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
      from: fromMock,
    })

    const { POST } = await import('./route')
    const request = new NextRequest('http://localhost/api/review-links', {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: 'workspace-1',
        type: 'public',
      }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        team_id: 'team-1',
        workspace_id: 'workspace-1',
      })
    )
    expect(payload).toEqual({
      id: 'link-1',
      team_id: 'team-1',
      workspace_id: 'workspace-1',
    })
  })
})
