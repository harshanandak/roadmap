/**
 * Resources Search API Route
 *
 * Full-text search across resources using PostgreSQL tsvector.
 * Supports weighted ranking (title > description > notes).
 *
 * Security: Team-based RLS with team membership validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ResourceWithMeta } from '@/lib/types/resources'

/**
 * GET /api/resources/search
 *
 * Search resources with full-text search and ranking.
 *
 * Query params:
 * - team_id (required)
 * - q (required) - Search query
 * - workspace_id (optional) - Filter by workspace
 * - resource_type (optional) - Filter by type
 * - include_deleted (optional) - Include deleted items
 * - limit (optional, default: 50)
 * - offset (optional, default: 0)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const teamId = searchParams.get('team_id')
    const query = searchParams.get('q')
    const workspaceId = searchParams.get('workspace_id')
    const resourceType = searchParams.get('resource_type')
    const includeDeleted = searchParams.get('include_deleted') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!teamId) {
      return NextResponse.json(
        { error: 'team_id is required' },
        { status: 400 }
      )
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query (q) is required' },
        { status: 400 }
      )
    }

    // Validate user and team membership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Use the search_resources database function
    const { data: searchResults, error } = await supabase
      .rpc('search_resources', {
        p_team_id: teamId,
        p_query: query.trim(),
        p_workspace_id: workspaceId || null,
        p_resource_type: resourceType || null,
        p_include_deleted: includeDeleted,
        p_limit: limit,
        p_offset: offset,
      })

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    const results: ResourceWithMeta[] = (searchResults || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      team_id: teamId,
      workspace_id: r.workspace_id as string || workspaceId,
      title: r.title as string,
      url: r.url as string | null,
      description: r.description as string | null,
      notes: r.notes as string | null,
      resource_type: r.resource_type as string,
      image_url: r.image_url as string | null,
      favicon_url: null,
      source_domain: r.source_domain as string | null,
      is_deleted: r.is_deleted as boolean,
      deleted_at: null,
      deleted_by: null,
      created_by: r.created_by as string,
      created_at: r.created_at as string,
      updated_at: r.created_at as string,
      last_modified_by: null,
      search_rank: r.search_rank as number,
      linked_work_items_count: r.linked_work_items_count as number,
    }))

    return NextResponse.json({
      data: results,
      query: query.trim(),
      pagination: {
        total: results.length,
        limit,
        offset,
        has_more: results.length === limit,
      },
    })
  } catch (error) {
    console.error('Resources search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
