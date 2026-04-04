import { describe, expect, it, beforeEach, vi } from 'vitest'

const createClientMock = vi.fn()
const createAdminClientMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('./review-client', () => ({
  PublicReviewPageClient: (props: unknown) => ({ type: 'PublicReviewPageClient', props }),
}))

describe('PublicReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads work items through the admin client for public review links', async () => {
    const linkSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: 'review-link-1',
        team_id: 'team-1',
        workspace_id: 'workspace-1',
        type: 'public',
        is_active: true,
        created_at: '2026-04-04T00:00:00.000Z',
        expires_at: null,
        allow_anonymous: true,
        require_email: false,
        workspaces: {
          id: 'workspace-1',
          team_id: 'team-1',
          name: 'Workspace One',
          description: 'Desc',
        },
      },
      error: null,
    })

    const reviewLinksQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: linkSingleMock,
    }

    const publicFromMock = vi.fn((table: string) => {
      if (table === 'review_links') return reviewLinksQuery
      throw new Error(`Unexpected public table lookup: ${table}`)
    })

    const itemsOrderMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'item-1',
          name: 'Feature One',
          description: null,
          type: 'feature',
          status: 'not_started',
          priority: 'medium',
          timeline_phase: null,
          created_at: '2026-04-04T00:00:00.000Z',
        },
      ],
      error: null,
    })

    const workItemsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: itemsOrderMock,
    }

    const adminFromMock = vi.fn((table: string) => {
      if (table === 'work_items') return workItemsQuery
      throw new Error(`Unexpected admin table lookup: ${table}`)
    })

    createClientMock.mockResolvedValue({
      from: publicFromMock,
    })

    createAdminClientMock.mockReturnValue({
      from: adminFromMock,
    })

    const { default: PublicReviewPage } = await import('./page')
    const result = await PublicReviewPage({
      params: Promise.resolve({ token: 'token-1' }),
    })

    expect(createAdminClientMock).toHaveBeenCalledTimes(1)
    expect(adminFromMock).toHaveBeenCalledWith('work_items')
    expect(workItemsQuery.eq).toHaveBeenNthCalledWith(1, 'workspace_id', 'workspace-1')
    expect(workItemsQuery.eq).toHaveBeenNthCalledWith(2, 'team_id', 'team-1')
    expect(result.type).toBeTypeOf('function')
    expect(result.props).toEqual(
      expect.objectContaining({
        workItems: [
          expect.objectContaining({
            id: 'item-1',
          }),
        ],
      })
    )
  })
})
