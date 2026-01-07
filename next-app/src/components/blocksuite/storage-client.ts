/**
 * BlockSuite Storage Client
 * Phase 4: Supabase Persistence (Yjs + Real-time)
 *
 * Supabase Storage client for Yjs binary state.
 * Uses native Supabase Storage API - no AWS SDK needed!
 *
 * Benefits:
 * - No @aws-sdk/client-s3 dependency (smaller bundle)
 * - Uses existing Supabase client (same auth)
 * - Storage policies work automatically
 * - Same API pattern as other Supabase operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  BLOCKSUITE_STORAGE_BUCKET,
  getStoragePath,
  type StorageResult,
} from './persistence-types'

/**
 * Save Yjs state to Supabase Storage
 * Path format: {team_id}/{doc_id}.yjs
 *
 * @param supabase - Supabase client instance
 * @param teamId - Team ID for folder isolation
 * @param docId - Document ID
 * @param state - Yjs binary state (Uint8Array)
 * @returns StorageResult with success status and size
 */
export async function saveYjsState(
  supabase: SupabaseClient,
  teamId: string,
  docId: string,
  state: Uint8Array
): Promise<StorageResult> {
  try {
    const path = getStoragePath(teamId, docId)

    const { error } = await supabase.storage
      .from(BLOCKSUITE_STORAGE_BUCKET)
      .upload(path, state, {
        contentType: 'application/octet-stream',
        upsert: true, // Overwrite if exists
      })

    if (error) {
      console.error('[BlockSuite Storage] Save error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, size: state.length }
  } catch (error) {
    console.error('[BlockSuite Storage] Save error:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Load Yjs state from Supabase Storage
 *
 * @param supabase - Supabase client instance
 * @param teamId - Team ID for folder isolation
 * @param docId - Document ID
 * @returns Yjs binary state or null if not found/error
 */
export async function loadYjsState(
  supabase: SupabaseClient,
  teamId: string,
  docId: string
): Promise<Uint8Array | null> {
  try {
    const path = getStoragePath(teamId, docId)

    const { data, error } = await supabase.storage
      .from(BLOCKSUITE_STORAGE_BUCKET)
      .download(path)

    if (error) {
      // File not found = new document, return null (not an error)
      if (
        error.message.includes('not found') ||
        error.message.includes('Object not found') ||
        error.message.includes('The resource was not found')
      ) {
        return null
      }
      console.error('[BlockSuite Storage] Load error:', error)
      return null
    }

    if (!data) return null
    return new Uint8Array(await data.arrayBuffer())
  } catch (error) {
    console.error('[BlockSuite Storage] Load error:', error)
    return null
  }
}

/**
 * Delete Yjs state from Supabase Storage
 *
 * @param supabase - Supabase client instance
 * @param teamId - Team ID for folder isolation
 * @param docId - Document ID
 * @returns true if deleted successfully
 */
export async function deleteYjsState(
  supabase: SupabaseClient,
  teamId: string,
  docId: string
): Promise<boolean> {
  try {
    const path = getStoragePath(teamId, docId)

    const { error } = await supabase.storage
      .from(BLOCKSUITE_STORAGE_BUCKET)
      .remove([path])

    if (error) {
      console.error('[BlockSuite Storage] Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[BlockSuite Storage] Delete error:', error)
    return false
  }
}

/**
 * Check if Yjs state exists in storage
 *
 * @param supabase - Supabase client instance
 * @param teamId - Team ID for folder isolation
 * @param docId - Document ID
 * @returns true if file exists
 */
export async function existsYjsState(
  supabase: SupabaseClient,
  teamId: string,
  docId: string
): Promise<boolean> {
  try {
    const { data } = await supabase.storage
      .from(BLOCKSUITE_STORAGE_BUCKET)
      .list(teamId, {
        search: `${docId}.yjs`,
        limit: 1,
      })

    return (data?.length ?? 0) > 0
  } catch (error) {
    console.error('[BlockSuite Storage] Exists check error:', error)
    return false
  }
}

/**
 * Get the size of Yjs state in storage (without downloading)
 *
 * @param supabase - Supabase client instance
 * @param teamId - Team ID for folder isolation
 * @param docId - Document ID
 * @returns Size in bytes, or null if not found
 */
export async function getYjsStateSize(
  supabase: SupabaseClient,
  teamId: string,
  docId: string
): Promise<number | null> {
  try {
    const { data } = await supabase.storage
      .from(BLOCKSUITE_STORAGE_BUCKET)
      .list(teamId, {
        search: `${docId}.yjs`,
        limit: 1,
      })

    if (!data || data.length === 0) return null

    // Find exact match
    const file = data.find((f) => f.name === `${docId}.yjs`)
    return file?.metadata?.size ?? null
  } catch (error) {
    console.error('[BlockSuite Storage] Get size error:', error)
    return null
  }
}

/**
 * List all documents for a team
 *
 * @param supabase - Supabase client instance
 * @param teamId - Team ID for folder isolation
 * @returns Array of document IDs
 */
export async function listTeamDocuments(
  supabase: SupabaseClient,
  teamId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BLOCKSUITE_STORAGE_BUCKET)
      .list(teamId, {
        limit: 1000,
      })

    if (error) {
      console.error('[BlockSuite Storage] List error:', error)
      return []
    }

    // Extract document IDs from filenames (remove .yjs extension)
    return (data ?? [])
      .filter((f) => f.name.endsWith('.yjs'))
      .map((f) => f.name.replace('.yjs', ''))
  } catch (error) {
    console.error('[BlockSuite Storage] List error:', error)
    return []
  }
}
