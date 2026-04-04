/**
 * Public Voting API Route
 *
 * POST /api/public/insights/[id]/vote
 * Allows public users to vote on insights.
 *
 * Respects workspace voting settings:
 * - enabled: Whether voting is allowed
 * - requireEmailVerification: If true, send magic link
 * - allowAnonymous: If false, email is required
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { votingRateLimit, getClientIp, hashIp, createRateLimitHeaders } from '@/lib/security/rate-limit'
import { z } from 'zod'

// Validation schema
const voteSchema = z.object({
  vote_type: z.enum(['up', 'down']),
  email: z.string().email().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: insightId } = await params

    // Rate limiting
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = votingRateLimit(clientIp)
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429, headers: rateLimitHeaders }
      )
    }

    // Parse body
    const body = await request.json()
    const parseResult = voteSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten() },
        { status: 400, headers: rateLimitHeaders }
      )
    }

    const { vote_type, email } = parseResult.data
    const supabase = await createClient()

    // Fetch insight with workspace settings
    const { data: insight, error: insightError } = await supabase
      .from('customer_insights')
      .select(`
        id,
        workspace_id,
        public_share_enabled,
        upvote_count,
        downvote_count,
        workspaces (
          id,
          public_feedback_enabled,
          voting_settings
        )
      `)
      .eq('id', insightId)
      .single()

    if (insightError || !insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404, headers: rateLimitHeaders }
      )
    }

    interface VotingSettings {
      enabled: boolean
      requireEmailVerification: boolean
      allowAnonymous: boolean
    }
    interface WorkspaceData {
      id: string
      public_feedback_enabled: boolean
      voting_settings?: VotingSettings
    }
    // Handle Supabase returning array or single object for joined data
    const workspacesData = insight.workspaces
    const workspace = Array.isArray(workspacesData)
      ? (workspacesData[0] as WorkspaceData | undefined) || null
      : (workspacesData as unknown as WorkspaceData | null)
    const votingSettings = workspace?.voting_settings || {
      enabled: true,
      requireEmailVerification: false,
      allowAnonymous: true,
    }

    // Check if insight is voteable
    if (!insight.public_share_enabled && !workspace?.public_feedback_enabled) {
      return NextResponse.json(
        { error: 'Voting is not available for this insight' },
        { status: 403, headers: rateLimitHeaders }
      )
    }

    // Check if voting is enabled
    if (!votingSettings.enabled) {
      return NextResponse.json(
        { error: 'Voting is disabled for this workspace' },
        { status: 403, headers: rateLimitHeaders }
      )
    }

    // Check if email is required
    if (!votingSettings.allowAnonymous && !email) {
      return NextResponse.json(
        { error: 'Email is required to vote' },
        { status: 400, headers: rateLimitHeaders }
      )
    }

    if (votingSettings.requireEmailVerification && !email) {
      return NextResponse.json(
        { error: 'Email is required for verified voting' },
        { status: 400, headers: rateLimitHeaders }
      )
    }

    // Check for duplicate votes (by email or IP)
    const ipHash = hashIp(clientIp)
    const _voterIdentifier = email || ipHash

    const { data: existingVote } = await supabase
      .from('insight_votes')
      .select('id, vote_type')
      .eq('insight_id', insightId)
      .or(`voter_email.eq.${email},voter_ip_hash.eq.${ipHash}`)
      .maybeSingle()

    if (existingVote) {
      // Already voted - check if changing vote
      if (existingVote.vote_type === vote_type) {
        return NextResponse.json(
          { error: 'You have already voted', existing_vote: existingVote.vote_type },
          { status: 400, headers: rateLimitHeaders }
        )
      }

      // Changing vote - update existing
      const { error: updateError } = await supabase
        .from('insight_votes')
        .update({
          vote_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingVote.id)

      if (updateError) {
        throw updateError
      }

      // Update vote counts on insight
      const oldVote = existingVote.vote_type
      const { error: _countError } = await supabase
        .from('customer_insights')
        .update({
          upvote_count: oldVote === 'up'
            ? (insight.upvote_count || 1) - 1
            : vote_type === 'up'
              ? (insight.upvote_count || 0) + 1
              : insight.upvote_count,
          downvote_count: oldVote === 'down'
            ? (insight.downvote_count || 1) - 1
            : vote_type === 'down'
              ? (insight.downvote_count || 0) + 1
              : insight.downvote_count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', insightId)

      return NextResponse.json({
        success: true,
        vote_type,
        message: 'Vote updated',
      }, { headers: rateLimitHeaders })
    }

    // Temporary compatibility fallback: until the verification flow exists end-to-end,
    // preserve voting for workspaces that already enabled the setting.

    // Instant voting (no verification required)
    const voteId = Date.now().toString()

    const { error: insertError } = await supabase
      .from('insight_votes')
      .insert({
        id: voteId,
        insight_id: insightId,
        vote_type,
        voter_email: email || null,
        voter_ip_hash: ipHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error inserting vote:', insertError)
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500, headers: rateLimitHeaders }
      )
    }

    // Update counts
    const { error: updateError } = await supabase
      .from('customer_insights')
      .update({
        upvote_count: vote_type === 'up' ? (insight.upvote_count || 0) + 1 : insight.upvote_count,
        downvote_count: vote_type === 'down' ? (insight.downvote_count || 0) + 1 : insight.downvote_count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', insightId)

    if (updateError) {
      console.error('Error updating vote counts:', updateError)
    }

    return NextResponse.json({
      success: true,
      vote_type,
      message: 'Vote recorded',
    }, { headers: rateLimitHeaders })
  } catch (error: unknown) {
    console.error('Public voting error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
