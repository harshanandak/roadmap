/**
 * Resource [id] API Routes
 *
 * Individual resource operations:
 * - GET: Fetch resource with linked work items
 * - PATCH: Update resource
 * - DELETE: Soft delete (move to trash) or restore
 *
 * Security: Team-based RLS with team membership validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateResourceRequest } from '@/lib/types/resources'
import { extractDomain } from '@/lib/types/resources'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/resources/[id]
 *
 * Fetch a single resource with linked work items.
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

    // Fetch resource (RLS will handle team access)
    const { data: resource, error } = await supabase
      .from('resources')
      .select(`
        *,
        created_by_user:users!resources_created_by_fkey(id, name, email),
        last_modified_by_user:users!resources_last_modified_by_fkey(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error || !resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Fetch linked work items
    const { data: links } = await supabase
      .from('work_item_resources')
      .select(`
        *,
        work_item:work_items(id, name, type, status),
        added_by_user:users!work_item_resources_added_by_fkey(id, name)
      `)
      .eq('resource_id', id)
      .eq('is_unlinked', false)
      .order('display_order', { ascending: true })

    return NextResponse.json({
      data: {
        ...resource,
        linked_work_items: links || [],
        linked_work_items_count: links?.length || 0,
      },
    })
  } catch (error) {
    console.error('Resource GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/resources/[id]
 *
 * Update a resource.
 * Special actions via query param:
 * - ?action=restore - Restore from trash
 * - ?action=permanent_delete - Permanently delete
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch current resource (RLS handles access)
    const { data: currentResource, error: fetchError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Handle restore action
    if (action === 'restore') {
      if (!currentResource.is_deleted) {
        return NextResponse.json(
          { error: 'Resource is not deleted' },
          { status: 400 }
        )
      }

      const { data: restoredResource, error: restoreError } = await supabase
        .from('resources')
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          updated_at: new Date().toISOString(),
          last_modified_by: user.id,
        })
        .eq('id', id)
        .select()
        .single()

      if (restoreError) {
        console.error('Error restoring resource:', restoreError)
        return NextResponse.json(
          { error: 'Failed to restore resource' },
          { status: 500 }
        )
      }

      // Log restore audit event
      await supabase.from('resource_audit_log').insert({
        id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        resource_id: id,
        action: 'restored',
        actor_id: user.id,
        actor_email: user.email,
        changes: { is_deleted: { old: true, new: false } },
        team_id: currentResource.team_id,
        workspace_id: currentResource.workspace_id,
      })

      return NextResponse.json({ data: restoredResource })
    }

    // Regular update
    const body: UpdateResourceRequest = await req.json()

    // Build update object and track changes
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      last_modified_by: user.id,
    }
    const changes: Record<string, { old: unknown; new: unknown }> = {}

    if (body.title !== undefined && body.title !== currentResource.title) {
      updates.title = body.title
      changes.title = { old: currentResource.title, new: body.title }
    }

    if (body.url !== undefined && body.url !== currentResource.url) {
      updates.url = body.url
      updates.source_domain = extractDomain(body.url)
      changes.url = { old: currentResource.url, new: body.url }
    }

    if (body.description !== undefined && body.description !== currentResource.description) {
      updates.description = body.description
      changes.description = { old: currentResource.description, new: body.description }
    }

    if (body.notes !== undefined && body.notes !== currentResource.notes) {
      updates.notes = body.notes
      changes.notes = { old: currentResource.notes, new: body.notes }
    }

    if (body.resource_type !== undefined && body.resource_type !== currentResource.resource_type) {
      updates.resource_type = body.resource_type
      changes.resource_type = { old: currentResource.resource_type, new: body.resource_type }
    }

    if (body.image_url !== undefined && body.image_url !== currentResource.image_url) {
      updates.image_url = body.image_url
      changes.image_url = { old: currentResource.image_url, new: body.image_url }
    }

    // Apply update
    const { data: updatedResource, error: updateError } = await supabase
      .from('resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating resource:', updateError)
      return NextResponse.json(
        { error: 'Failed to update resource' },
        { status: 500 }
      )
    }

    // Log update audit event (only if there were changes)
    if (Object.keys(changes).length > 0) {
      await supabase.from('resource_audit_log').insert({
        id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        resource_id: id,
        action: 'updated',
        actor_id: user.id,
        actor_email: user.email,
        changes,
        team_id: currentResource.team_id,
        workspace_id: currentResource.workspace_id,
      })
    }

    return NextResponse.json({ data: updatedResource })
  } catch (error) {
    console.error('Resource PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/resources/[id]
 *
 * Soft delete a resource (move to trash).
 * Use ?permanent=true for permanent deletion.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const permanent = searchParams.get('permanent') === 'true'

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch current resource
    const { data: currentResource, error: fetchError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    if (permanent) {
      // Permanent delete - requires creator or admin
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', currentResource.team_id)
        .eq('user_id', user.id)
        .single()

      const isCreator = currentResource.created_by === user.id
      const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'

      if (!isCreator && !isAdmin) {
        return NextResponse.json(
          { error: 'Only creator or admin can permanently delete' },
          { status: 403 }
        )
      }

      // Hard delete
      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error permanently deleting resource:', deleteError)
        return NextResponse.json(
          { error: 'Failed to permanently delete resource' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Resource permanently deleted' })
    }

    // Soft delete
    const { data: deletedResource, error: softDeleteError } = await supabase
      .from('resources')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (softDeleteError) {
      console.error('Error soft deleting resource:', softDeleteError)
      return NextResponse.json(
        { error: 'Failed to delete resource' },
        { status: 500 }
      )
    }

    // Log delete audit event
    await supabase.from('resource_audit_log').insert({
      id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resource_id: id,
      action: 'deleted',
      actor_id: user.id,
      actor_email: user.email,
      changes: { is_deleted: { old: false, new: true } },
      team_id: currentResource.team_id,
      workspace_id: currentResource.workspace_id,
    })

    return NextResponse.json({
      data: deletedResource,
      message: 'Resource moved to trash. It will be permanently deleted after 30 days.',
    })
  } catch (error) {
    console.error('Resource DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
