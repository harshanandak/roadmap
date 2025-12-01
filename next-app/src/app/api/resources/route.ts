/**
 * Resources API Routes
 *
 * CRUD operations for resources with:
 * - Full-text search
 * - Soft delete with recycle bin
 * - Audit logging
 *
 * Security: Team-based RLS with team membership validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  CreateResourceRequest,
  Resource,
  ResourceWithMeta,
} from '@/lib/types/resources'
import { extractDomain } from '@/lib/types/resources'

/**
 * GET /api/resources
 *
 * List resources with optional filtering.
 * Query params:
 * - team_id (required)
 * - workspace_id (optional)
 * - resource_type (optional)
 * - include_deleted (optional, default: false)
 * - limit (optional, default: 50)
 * - offset (optional, default: 0)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const teamId = searchParams.get('team_id')
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

    // Validate team membership
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

    // Build query
    let query = supabase
      .from('resources')
      .select(`
        *,
        created_by_user:users!resources_created_by_fkey(id, name, email)
      `)
      .eq('team_id', teamId)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: resources, error, count } = await query

    if (error) {
      console.error('Error fetching resources:', error)
      return NextResponse.json(
        { error: 'Failed to fetch resources' },
        { status: 500 }
      )
    }

    // Get linked work item counts
    const resourceIds = resources?.map(r => r.id) || []
    const { data: linkCounts } = await supabase
      .from('work_item_resources')
      .select('resource_id')
      .in('resource_id', resourceIds)
      .eq('is_unlinked', false)

    const countMap = new Map<string, number>()
    linkCounts?.forEach(link => {
      countMap.set(link.resource_id, (countMap.get(link.resource_id) || 0) + 1)
    })

    const resourcesWithMeta: ResourceWithMeta[] = (resources || []).map(r => ({
      ...r,
      linked_work_items_count: countMap.get(r.id) || 0,
    }))

    return NextResponse.json({
      data: resourcesWithMeta,
      pagination: {
        total: count || resourcesWithMeta.length,
        limit,
        offset,
        has_more: resourcesWithMeta.length === limit,
      },
    })
  } catch (error) {
    console.error('Resources GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/resources
 *
 * Create a new resource.
 * Optionally link to a work item immediately.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body: CreateResourceRequest = await req.json()

    const {
      workspace_id,
      team_id,
      title,
      url,
      description,
      notes,
      resource_type = 'reference',
      image_url,
      work_item_id,
      tab_type = 'resource',
      context_note,
    } = body

    if (!workspace_id || !team_id || !title) {
      return NextResponse.json(
        { error: 'workspace_id, team_id, and title are required' },
        { status: 400 }
      )
    }

    // Validate team membership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Generate timestamp-based ID
    const id = Date.now().toString()

    // Extract domain from URL
    const source_domain = extractDomain(url || null)

    // Create resource
    const { data: resource, error: createError } = await supabase
      .from('resources')
      .insert({
        id,
        workspace_id,
        team_id,
        title,
        url: url || null,
        description: description || null,
        notes: notes || null,
        resource_type,
        image_url: image_url || null,
        source_domain,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating resource:', createError)
      return NextResponse.json(
        { error: 'Failed to create resource' },
        { status: 500 }
      )
    }

    // Log audit event
    await supabase.from('resource_audit_log').insert({
      id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resource_id: resource.id,
      action: 'created',
      actor_id: user.id,
      actor_email: user.email,
      changes: { title: { old: null, new: title } },
      team_id,
      workspace_id,
    })

    // If work_item_id provided, link the resource
    if (work_item_id) {
      const { error: linkError } = await supabase
        .from('work_item_resources')
        .insert({
          work_item_id,
          resource_id: resource.id,
          team_id,
          tab_type,
          context_note: context_note || null,
          added_by: user.id,
          display_order: 0,
        })

      if (linkError) {
        console.error('Error linking resource:', linkError)
        // Don't fail the request, resource was created successfully
      } else {
        // Log link audit event
        await supabase.from('resource_audit_log').insert({
          id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          resource_id: resource.id,
          work_item_id,
          action: 'linked',
          actor_id: user.id,
          actor_email: user.email,
          changes: { tab_type: { old: null, new: tab_type } },
          team_id,
          workspace_id,
        })
      }
    }

    return NextResponse.json({ data: resource }, { status: 201 })
  } catch (error) {
    console.error('Resources POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
