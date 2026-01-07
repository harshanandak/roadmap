/**
 * BlockSuite Document Metadata API
 * Phase 4: Supabase Persistence (Yjs + Real-time)
 *
 * CRUD operations for document metadata (NOT Yjs state).
 * Yjs binary state is stored in Supabase Storage, not PostgreSQL.
 *
 * SECURITY:
 * - Document ID validation prevents path traversal
 * - Zod validation on all inputs
 * - RLS policies enforce team_id filtering
 * - Audit logging for security-relevant operations
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isValidId } from '@/components/blocksuite/persistence-types'
import { safeValidateDocumentUpdate } from '@/components/blocksuite/schema'

/**
 * Audit log helper for security-relevant operations
 */
function auditLog(
  event: string,
  details: Record<string, unknown>
): void {
  console.log(
    JSON.stringify({
      event,
      ...details,
      timestamp: new Date().toISOString(),
    })
  )
}

/**
 * GET /api/blocksuite/documents/[id]
 * Load document metadata
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // SECURITY: Validate document ID format
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid document ID format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team memberships for explicit filtering
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)

    const teamIds = memberships?.map((m) => m.team_id) ?? []
    if (teamIds.length === 0) {
      return NextResponse.json({ error: 'No team access' }, { status: 403 })
    }

    // Get document metadata with explicit team_id filtering
    const { data: document, error } = await supabase
      .from('blocksuite_documents')
      .select('*')
      .eq('id', id)
      .in('team_id', teamIds)
      .single()

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error: unknown) {
    console.error('Error in GET /api/blocksuite/documents/[id]:', error)
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/blocksuite/documents/[id]
 * Update document metadata (title, document_type, etc.)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // SECURITY: Validate document ID format
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid document ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // SECURITY: Validate input with Zod schema
    const validation = safeValidateDocumentUpdate(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { title, documentType } = validation.data

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team memberships for explicit filtering
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)

    const teamIds = memberships?.map((m) => m.team_id) ?? []
    if (teamIds.length === 0) {
      return NextResponse.json({ error: 'No team access' }, { status: 403 })
    }

    // Build updates object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updates.title = title
    if (documentType !== undefined) updates.document_type = documentType

    // Update document metadata with explicit team_id filtering
    const { data: document, error } = await supabase
      .from('blocksuite_documents')
      .update(updates)
      .eq('id', id)
      .in('team_id', teamIds)
      .select()
      .single()

    if (error || !document) {
      console.error('Error updating document:', error)
      return NextResponse.json(
        { error: error?.message ?? 'Document not found' },
        { status: error ? 500 : 404 }
      )
    }

    // SECURITY: Audit log
    auditLog('document_updated', {
      documentId: id,
      userId: user.id,
      teamId: document.team_id,
      fields: Object.keys(updates).filter((k) => k !== 'updated_at'),
    })

    return NextResponse.json({ document })
  } catch (error: unknown) {
    console.error('Error in PATCH /api/blocksuite/documents/[id]:', error)
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/blocksuite/documents/[id]
 * Delete document (metadata + Supabase Storage object)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // SECURITY: Validate document ID format
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid document ID format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team memberships for explicit filtering
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)

    const teamIds = memberships?.map((m) => m.team_id) ?? []
    if (teamIds.length === 0) {
      return NextResponse.json({ error: 'No team access' }, { status: 403 })
    }

    // Get document first to get storage_path with explicit team_id filtering
    const { data: document, error: fetchError } = await supabase
      .from('blocksuite_documents')
      .select('id, team_id, storage_path')
      .eq('id', id)
      .in('team_id', teamIds)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // SECURITY: Audit log before deletion
    auditLog('document_delete_attempt', {
      documentId: id,
      userId: user.id,
      teamId: document.team_id,
    })

    // Delete from Supabase Storage first
    const { error: storageError } = await supabase.storage
      .from('blocksuite-yjs')
      .remove([document.storage_path])

    if (storageError) {
      console.warn('Storage delete error (continuing):', storageError)
      // Continue even if storage delete fails - file may not exist yet
    }

    // Delete document metadata with explicit team_id filtering
    const { error: deleteError } = await supabase
      .from('blocksuite_documents')
      .delete()
      .eq('id', id)
      .in('team_id', teamIds)

    if (deleteError) {
      console.error('Error deleting document:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // SECURITY: Audit log successful deletion
    auditLog('document_deleted', {
      documentId: id,
      userId: user.id,
      teamId: document.team_id,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error in DELETE /api/blocksuite/documents/[id]:', error)
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
