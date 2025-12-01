/**
 * Resource History API Route
 *
 * Get the complete audit trail for a resource.
 *
 * Security: Team-based RLS with team membership validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/resources/[id]/history
 *
 * Get the complete audit trail for a resource.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch resource to verify access (RLS handles team check)
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('id, title, team_id, workspace_id')
      .eq('id', id)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Use the get_resource_history database function
    const { data: history, error: historyError } = await supabase
      .rpc('get_resource_history', {
        resource_id_param: id,
      })

    if (historyError) {
      console.error('Error fetching history:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      )
    }

    // Enrich with user names
    const actorIds = [...new Set((history || []).map((h: { actor_id: string }) => h.actor_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', actorIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])

    const enrichedHistory = (history || []).map((entry: {
      action: string
      performed_at: string
      actor_id: string
      actor_email: string | null
      work_item_id: string | null
      changes: unknown
    }) => ({
      ...entry,
      actor: userMap.get(entry.actor_id) || {
        id: entry.actor_id,
        name: entry.actor_email || 'Unknown User',
        email: entry.actor_email,
      },
    }))

    return NextResponse.json({
      data: enrichedHistory,
      resource: {
        id: resource.id,
        title: resource.title,
      },
    })
  } catch (error) {
    console.error('Resource history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
