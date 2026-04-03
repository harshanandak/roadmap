/**
 * Compressed Context API
 *
 * POST /api/knowledge/context - Get compressed context for AI prompts
 *
 * This endpoint provides multi-layer knowledge retrieval:
 * - L2: Relevant document summaries
 * - L3: Related topic summaries
 * - L4: Connected concepts
 *
 * All within a specified token budget.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveTeam } from '@/lib/teams/active-team'
import { embedQuery, formatEmbeddingForPgvector } from '@/lib/ai/embeddings/embedding-service'
import type { CompressedContext, CompressedContextItem, CompressionLayer } from '@/lib/types/collective-intelligence'

/**
 * POST /api/knowledge/context
 *
 * Get compressed context for a query
 *
 * Request body:
 * - query: The search query
 * - workspaceId: Optional workspace scope
 * - maxTokens: Token budget (default: 2000)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activeTeamId } = await resolveActiveTeam(supabase, user.id)

    if (!activeTeamId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }
    const teamId = activeTeamId

    // Parse request body
    const body = await request.json()
    const {
      query,
      workspaceId,
      maxTokens = 2000,
    } = body as {
      query: string
      workspaceId?: string
      maxTokens?: number
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Generate query embedding
    const queryEmbedding = await embedQuery(query)

    // Call the get_compressed_context database function
    const { data: results, error: searchError } = await supabase.rpc('get_compressed_context', {
      p_team_id: teamId,
      p_query_embedding: formatEmbeddingForPgvector(queryEmbedding),
      p_workspace_id: workspaceId || null,
      p_max_tokens: Math.min(maxTokens, 8000),
    })

    if (searchError) {
      console.error('[Compressed Context API] Search error:', searchError)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Transform results
    const items: CompressedContextItem[] = (results || []).map((row: {
      layer: string
      source_id: string
      source_name: string
      content: string
      similarity: number
      token_count: number
    }) => ({
      layer: row.layer as CompressionLayer,
      sourceId: row.source_id,
      sourceName: row.source_name,
      content: row.content,
      similarity: Math.round(row.similarity * 1000) / 1000,
      tokenCount: row.token_count,
    }))

    // Calculate layer counts
    const layers = {
      L1: 0,
      L2: items.filter(i => i.layer === 'L2').length,
      L3: items.filter(i => i.layer === 'L3').length,
      L4: items.filter(i => i.layer === 'L4').length,
    }

    const totalTokens = items.reduce((sum, item) => sum + item.tokenCount, 0)

    const context: CompressedContext = {
      items,
      totalTokens,
      layers,
    }

    const durationMs = Date.now() - startTime

    return NextResponse.json({
      context,
      queryId: Date.now().toString(),
      durationMs,
    })
  } catch (error) {
    console.error('[Compressed Context API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get compressed context' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/knowledge/context
 *
 * Returns API info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'Compressed Context API',
    method: 'POST',
    description: 'Get multi-layer compressed context for AI prompts',
    requestBody: {
      query: 'string (required) - Search query',
      workspaceId: 'string (optional) - Workspace scope',
      maxTokens: 'number (optional, default: 2000, max: 8000) - Token budget',
    },
    response: {
      context: {
        items: 'Array of context items with layer, source, content, similarity',
        totalTokens: 'number - Total tokens in response',
        layers: 'object - Count of items per layer (L2, L3, L4)',
      },
      queryId: 'string - Unique query ID',
      durationMs: 'number - Search duration',
    },
    layers: {
      L2: 'Document summaries (~200 tokens each)',
      L3: 'Topic summaries (~500 tokens each)',
      L4: 'Concept descriptions (~50 tokens each)',
    },
  })
}
