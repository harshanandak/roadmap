import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const createRateLimitHeadersMock = vi.fn()
const getClientIpMock = vi.fn()
const hashIpMock = vi.fn()
const votingRateLimitMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/security/rate-limit', () => ({
  createRateLimitHeaders: createRateLimitHeadersMock,
  getClientIp: getClientIpMock,
  hashIp: hashIpMock,
  votingRateLimit: votingRateLimitMock,
}))

describe('POST /api/public/insights/[id]/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createRateLimitHeadersMock.mockReturnValue({})
    getClientIpMock.mockReturnValue('127.0.0.1')
    hashIpMock.mockReturnValue('hashed-ip')
    votingRateLimitMock.mockReturnValue({ allowed: true })
  })

  it('keeps voting available for verified-voting workspaces instead of returning 501', async () => {
    const insight = {
      id: 'insight-1',
      workspace_id: 'workspace-1',
      public_share_enabled: true,
      upvote_count: 0,
      downvote_count: 0,
      workspaces: {
        id: 'workspace-1',
        public_feedback_enabled: true,
        voting_settings: {
          allowAnonymous: true,
          enabled: true,
          requireEmailVerification: true,
        },
      },
    }

    const customerInsightSelectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: insight, error: null }),
    }
    const existingVoteQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    }
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const insertVoteQuery = {
      insert: insertMock,
    }
    const updateCountsQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }

    let customerInsightsCalls = 0
    let insightVotesCalls = 0

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'customer_insights') {
          customerInsightsCalls += 1
          return customerInsightsCalls === 1
            ? customerInsightSelectQuery
            : updateCountsQuery
        }

        if (table === 'insight_votes') {
          insightVotesCalls += 1
          return insightVotesCalls === 1 ? existingVoteQuery : insertVoteQuery
        }

        throw new Error(`Unexpected table lookup: ${table}`)
      }),
    })

    const { POST } = await import('./route')
    const request = new NextRequest('http://localhost/api/public/insights/insight-1/vote', {
      method: 'POST',
      body: JSON.stringify({ vote_type: 'up', email: 'voter@example.com' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'insight-1' }) })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      success: true,
      vote_type: 'up',
    })
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        insight_id: 'insight-1',
        vote_type: 'up',
        voter_email: 'voter@example.com',
      })
    )
  })
})
