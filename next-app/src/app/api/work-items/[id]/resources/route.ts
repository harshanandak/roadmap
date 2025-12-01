/**
 * Work Item Resources API Routes
 *
 * Manage resources linked to a work item:
 * - GET: List resources for a work item (inspiration + resources tabs)
 * - POST: Link an existing resource or create and link
 * - DELETE: Unlink a resource from the work item
 *
 * Security: Team-based RLS with team membership validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  WorkItemResourcesResponse,
  LinkResourceRequest,
  CreateAndLinkResourceRequest,
} from '@/lib/types/resources'
import { extractDomain } from '@/lib/types/resources'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/work-items/[id]/resources
 *
 * Get all resources linked to a work item, organized by tab.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: workItemId } = await params
    const supabase = await createClient()

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify work item exists and user has access (RLS handles team check)
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .select('id, team_id')
      .eq('id', workItemId)
      .single()

    if (workItemError || !workItem) {
      return NextResponse.json(
        { error: 'Work item not found' },
        { status: 404 }
      )
    }

    // Fetch linked resources
    const { data: links, error: linksError } = await supabase
      .from('work_item_resources')
      .select(`
        *,
        resource:resources(*),
        added_by_user:users!work_item_resources_added_by_fkey(id, name)
      `)
      .eq('work_item_id', workItemId)
      .eq('is_unlinked', false)
      .order('display_order', { ascending: true })

    if (linksError) {
      console.error('Error fetching work item resources:', linksError)
      return NextResponse.json(
        { error: 'Failed to fetch resources' },
        { status: 500 }
      )
    }

    // Organize by tab type
    const response: WorkItemResourcesResponse = {
      inspiration: [],
      resources: [],
    }

    ;(links || []).forEach(link => {
      // Skip if resource is deleted
      if (link.resource?.is_deleted) return

      const enrichedLink = {
        ...link,
        resource: link.resource,
        added_by_user: link.added_by_user,
      }

      if (link.tab_type === 'inspiration') {
        response.inspiration.push(enrichedLink)
      } else {
        response.resources.push(enrichedLink)
      }
    })

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Work item resources GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/work-items/[id]/resources
 *
 * Link a resource to the work item.
 * Can either link an existing resource or create a new one.
 *
 * Body for linking existing:
 *   { resource_id: string, tab_type?: string, context_note?: string }
 *
 * Body for creating new:
 *   { title: string, url?: string, ... (full resource fields) }
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: workItemId } = await params
    const supabase = await createClient()
    const body = await req.json()

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify work item exists and get team_id
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .select('id, team_id, workspace_id')
      .eq('id', workItemId)
      .single()

    if (workItemError || !workItem) {
      return NextResponse.json(
        { error: 'Work item not found' },
        { status: 404 }
      )
    }

    // Determine if linking existing or creating new
    const isLinkingExisting = 'resource_id' in body && body.resource_id

    if (isLinkingExisting) {
      // Link existing resource
      const { resource_id, tab_type = 'resource', context_note, display_order } = body as LinkResourceRequest

      // Verify resource exists
      const { data: resource, error: resourceError } = await supabase
        .from('resources')
        .select('id, team_id')
        .eq('id', resource_id)
        .eq('is_deleted', false)
        .single()

      if (resourceError || !resource) {
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        )
      }

      // Verify same team
      if (resource.team_id !== workItem.team_id) {
        return NextResponse.json(
          { error: 'Resource and work item must be in the same team' },
          { status: 400 }
        )
      }

      // Check if already linked
      const { data: existingLink } = await supabase
        .from('work_item_resources')
        .select('work_item_id, is_unlinked')
        .eq('work_item_id', workItemId)
        .eq('resource_id', resource_id)
        .single()

      if (existingLink && !existingLink.is_unlinked) {
        return NextResponse.json(
          { error: 'Resource is already linked to this work item' },
          { status: 400 }
        )
      }

      // Re-link if previously unlinked, otherwise create new link
      if (existingLink) {
        const { error: updateError } = await supabase
          .from('work_item_resources')
          .update({
            is_unlinked: false,
            unlinked_at: null,
            unlinked_by: null,
            tab_type,
            context_note: context_note || null,
            added_by: user.id,
            added_at: new Date().toISOString(),
          })
          .eq('work_item_id', workItemId)
          .eq('resource_id', resource_id)

        if (updateError) {
          console.error('Error re-linking resource:', updateError)
          return NextResponse.json(
            { error: 'Failed to link resource' },
            { status: 500 }
          )
        }
      } else {
        // Get current max display order
        const { data: maxOrderResult } = await supabase
          .from('work_item_resources')
          .select('display_order')
          .eq('work_item_id', workItemId)
          .eq('tab_type', tab_type)
          .order('display_order', { ascending: false })
          .limit(1)

        const nextOrder = display_order ?? ((maxOrderResult?.[0]?.display_order ?? -1) + 1)

        const { error: insertError } = await supabase
          .from('work_item_resources')
          .insert({
            work_item_id: workItemId,
            resource_id,
            team_id: workItem.team_id,
            tab_type,
            context_note: context_note || null,
            display_order: nextOrder,
            added_by: user.id,
          })

        if (insertError) {
          console.error('Error linking resource:', insertError)
          return NextResponse.json(
            { error: 'Failed to link resource' },
            { status: 500 }
          )
        }
      }

      // Log audit event
      await supabase.from('resource_audit_log').insert({
        id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        resource_id,
        work_item_id: workItemId,
        action: 'linked',
        actor_id: user.id,
        actor_email: user.email,
        changes: { tab_type: { old: null, new: tab_type } },
        team_id: workItem.team_id,
        workspace_id: workItem.workspace_id,
      })

      return NextResponse.json({ message: 'Resource linked successfully' }, { status: 201 })
    } else {
      // Create new resource and link
      const createBody = body as CreateAndLinkResourceRequest
      const {
        title,
        url,
        description,
        notes,
        resource_type = 'reference',
        image_url,
        tab_type = 'resource',
        context_note,
      } = createBody

      if (!title) {
        return NextResponse.json(
          { error: 'title is required' },
          { status: 400 }
        )
      }

      // Generate ID and create resource
      const resourceId = Date.now().toString()
      const source_domain = extractDomain(url || null)

      const { data: resource, error: createError } = await supabase
        .from('resources')
        .insert({
          id: resourceId,
          workspace_id: workItem.workspace_id,
          team_id: workItem.team_id,
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

      // Log creation audit event
      await supabase.from('resource_audit_log').insert({
        id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        resource_id: resourceId,
        action: 'created',
        actor_id: user.id,
        actor_email: user.email,
        changes: { title: { old: null, new: title } },
        team_id: workItem.team_id,
        workspace_id: workItem.workspace_id,
      })

      // Link to work item
      const { error: linkError } = await supabase
        .from('work_item_resources')
        .insert({
          work_item_id: workItemId,
          resource_id: resourceId,
          team_id: workItem.team_id,
          tab_type,
          context_note: context_note || null,
          display_order: 0,
          added_by: user.id,
        })

      if (linkError) {
        console.error('Error linking new resource:', linkError)
        // Resource was created, but linking failed
      } else {
        // Log link audit event
        await supabase.from('resource_audit_log').insert({
          id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          resource_id: resourceId,
          work_item_id: workItemId,
          action: 'linked',
          actor_id: user.id,
          actor_email: user.email,
          changes: { tab_type: { old: null, new: tab_type } },
          team_id: workItem.team_id,
          workspace_id: workItem.workspace_id,
        })
      }

      return NextResponse.json({ data: resource }, { status: 201 })
    }
  } catch (error) {
    console.error('Work item resources POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/work-items/[id]/resources?resource_id=xxx
 *
 * Unlink a resource from the work item.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: workItemId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const resourceId = searchParams.get('resource_id')

    if (!resourceId) {
      return NextResponse.json(
        { error: 'resource_id query parameter is required' },
        { status: 400 }
      )
    }

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify work item exists
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .select('id, team_id, workspace_id')
      .eq('id', workItemId)
      .single()

    if (workItemError || !workItem) {
      return NextResponse.json(
        { error: 'Work item not found' },
        { status: 404 }
      )
    }

    // Soft unlink the resource
    const { data: link, error: updateError } = await supabase
      .from('work_item_resources')
      .update({
        is_unlinked: true,
        unlinked_at: new Date().toISOString(),
        unlinked_by: user.id,
      })
      .eq('work_item_id', workItemId)
      .eq('resource_id', resourceId)
      .eq('is_unlinked', false)
      .select()
      .single()

    if (updateError || !link) {
      return NextResponse.json(
        { error: 'Resource link not found' },
        { status: 404 }
      )
    }

    // Log unlink audit event
    await supabase.from('resource_audit_log').insert({
      id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resource_id: resourceId,
      work_item_id: workItemId,
      action: 'unlinked',
      actor_id: user.id,
      actor_email: user.email,
      changes: { is_unlinked: { old: false, new: true } },
      team_id: workItem.team_id,
      workspace_id: workItem.workspace_id,
    })

    return NextResponse.json({ message: 'Resource unlinked successfully' })
  } catch (error) {
    console.error('Work item resources DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
