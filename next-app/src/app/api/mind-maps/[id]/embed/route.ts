/**
 * Mind Map Embedding API
 *
 * POST /api/mind-maps/[id]/embed - Generate embeddings for a mind map
 * GET  /api/mind-maps/[id]/embed - Get embedding status
 *
 * Delegates to the shared mindmap-embedding-service for consistency
 * between API calls and background jobs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { embedMindMap } from '@/lib/ai/embeddings/mindmap-embedding-service'
import { safeValidateEmbedMindMapRequest } from '@/components/blocksuite/schema'

// =============================================================================
// POST /api/mind-maps/[id]/embed
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mindMapId } = await params

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

    // Get user's team for explicit team_id filtering (multi-tenant safety)
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const teamId = membership.team_id

    // Parse and validate request body
    let force = false
    try {
      const body = await request.json()
      const validation = safeValidateEmbedMindMapRequest(body)
      if (validation.success) {
        force = validation.data.force
      }
    } catch {
      // Empty body is fine, use defaults
    }

    // Verify mind map exists and user has access (explicit team_id filter + RLS)
    const { data: mindMap, error: mindMapError } = await supabase
      .from('mind_maps')
      .select('id')
      .eq('id', mindMapId)
      .eq('team_id', teamId)
      .single()

    if (mindMapError || !mindMap) {
      return NextResponse.json({ error: 'Mind map not found' }, { status: 404 })
    }

    // Delegate to shared embedding service
    const result = await embedMindMap(supabase, mindMapId, { force })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          durationMs: result.durationMs,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      chunks: result.chunks,
      tokens: result.tokens,
      durationMs: result.durationMs,
      reason: result.reason,
      stats: result.stats,
    })
  } catch (error) {
    console.error('[Embed] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Embedding failed',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET /api/mind-maps/[id]/embed - Get embedding status
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team for explicit team_id filtering (multi-tenant safety)
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const teamId = membership.team_id

    // Get mind map embedding status (explicit team_id filter + RLS)
    const { data: mindMap, error } = await supabase
      .from('mind_maps')
      .select('id, name, embedding_status, embedding_error, last_embedded_at, embedding_version, chunk_count')
      .eq('id', mindMapId)
      .eq('team_id', teamId)
      .single()

    if (error || !mindMap) {
      return NextResponse.json({ error: 'Mind map not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: mindMap.id,
      name: mindMap.name,
      embedding: {
        status: mindMap.embedding_status || 'pending',
        error: mindMap.embedding_error,
        lastEmbeddedAt: mindMap.last_embedded_at,
        version: mindMap.embedding_version || 0,
        chunkCount: mindMap.chunk_count || 0,
      },
    })
  } catch (error) {
    console.error('[Embed] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get embedding status' },
      { status: 500 }
    )
  }
}
