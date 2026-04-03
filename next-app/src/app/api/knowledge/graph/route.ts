/**
 * Knowledge Graph API
 *
 * GET /api/knowledge/graph - Get knowledge graph for visualization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveTeam } from '@/lib/teams/active-team'
import { getKnowledgeGraph } from '@/lib/ai/compression'

/**
 * GET /api/knowledge/graph
 *
 * Get the knowledge graph for a team/workspace
 *
 * Query params:
 * - workspaceId: Optional workspace scope
 * - limit: Max concepts (default: 50, max: 100)
 */
export async function GET(request: NextRequest) {
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Get knowledge graph
    const graph = await getKnowledgeGraph(activeTeamId, workspaceId, limit)

    return NextResponse.json({ graph })
  } catch (error) {
    console.error('[Knowledge Graph API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get knowledge graph' },
      { status: 500 }
    )
  }
}
