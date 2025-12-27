/**
 * Public Insight API Route
 *
 * GET /api/public/insights/[id]
 * Returns sanitized insight data for public voting page.
 * Only returns if insight has public_share_enabled = true.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Query insight with workspace info
    const { data: insight, error } = await supabase
      .from('customer_insights')
      .select(`
        id,
        title,
        quote,
        sentiment,
        tags,
        upvote_count,
        downvote_count,
        public_share_enabled,
        workspace_id,
        workspaces (
          id,
          name,
          icon,
          public_feedback_enabled,
          voting_settings
        )
      `)
      .eq('id', id)
      .single()

    if (error || !insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      )
    }

    // Define workspace type for this context
    interface WorkspaceData {
      id?: string
      name?: string
      icon?: string
      public_feedback_enabled?: boolean
      voting_settings?: {
        enabled?: boolean
        requireEmailVerification?: boolean
        allowAnonymous?: boolean
      }
    }

    // Check if insight is publicly shareable
    if (!insight.public_share_enabled) {
      // Also check if workspace has public feedback enabled
      const workspacesData = insight.workspaces
      const workspace = (Array.isArray(workspacesData) ? workspacesData[0] : workspacesData) as WorkspaceData
      if (!workspace?.public_feedback_enabled) {
        return NextResponse.json(
          { error: 'This insight is not available for public voting' },
          { status: 403 }
        )
      }
    }

    const workspacesData = insight.workspaces
    const workspace = (Array.isArray(workspacesData) ? workspacesData[0] : workspacesData) as WorkspaceData

    // Check if voting is enabled
    const votingSettings = workspace?.voting_settings || {
      enabled: true,
      requireEmailVerification: false,
      allowAnonymous: true,
    }

    // Return sanitized insight (no PII)
    return NextResponse.json({
      insight: {
        id: insight.id,
        title: insight.title,
        // Truncate quote for preview, remove any potential PII
        quote_preview: insight.quote
          ? insight.quote.substring(0, 200) + (insight.quote.length > 200 ? '...' : '')
          : null,
        sentiment: insight.sentiment,
        tags: insight.tags || [],
        upvote_count: insight.upvote_count || 0,
        downvote_count: insight.downvote_count || 0,
      },
      workspace: {
        id: workspace?.id,
        name: workspace?.name,
        voting_settings: votingSettings,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching public insight:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
