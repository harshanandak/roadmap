/**
 * Purge Deleted Resources Edge Function
 *
 * Manually triggers the purge of soft-deleted resources and unlinked records.
 * This function can be called:
 * - Manually from admin dashboard
 * - Via pg_cron + pg_net for scheduled runs with enhanced logging
 * - Via external monitoring systems
 *
 * Security: Requires service_role key (admin-only operation)
 *
 * @example
 * POST /functions/v1/purge-deleted-resources
 * Headers: { Authorization: Bearer <SERVICE_ROLE_KEY> }
 * Body: { "days": 30 } (optional, defaults to 30)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

// CORS headers for API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PurgeRequest {
  days?: number
  dry_run?: boolean
}

interface PurgeResult {
  success: boolean
  resources_purged: number
  links_purged: number
  days_threshold: number
  dry_run: boolean
  executed_at: string
  duration_ms: number
  error?: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify authorization - require service_role key for this admin operation
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify the token is the service role key (basic check)
    const token = authHeader.replace('Bearer ', '')
    if (token !== supabaseServiceKey) {
      // Try to validate as a regular user - but this should be admin only
      const supabase = createClient(supabaseUrl, token)
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. This operation requires service_role access.' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // TODO: Could check if user is a super-admin here
      // For now, only service_role key is allowed
      return new Response(
        JSON.stringify({ error: 'This operation requires service_role key, not user JWT.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    let body: PurgeRequest = {}
    try {
      const text = await req.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch {
      // Empty body is fine, use defaults
    }

    const days = body.days ?? 30
    const dryRun = body.dry_run ?? false

    // Validate days parameter
    if (days < 1 || days > 365) {
      return new Response(
        JSON.stringify({ error: 'days must be between 1 and 365' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let resourcesPurged = 0
    let linksPurged = 0

    if (dryRun) {
      // Dry run - just count what would be deleted
      const { data: resourceCount } = await supabase
        .from('resources')
        .select('id', { count: 'exact', head: true })
        .eq('is_deleted', true)
        .lt('deleted_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      const { data: linkCount } = await supabase
        .from('work_item_resources')
        .select('work_item_id', { count: 'exact', head: true })
        .eq('is_unlinked', true)
        .lt('unlinked_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      resourcesPurged = resourceCount?.length ?? 0
      linksPurged = linkCount?.length ?? 0

      console.log(`[DRY RUN] Would purge ${resourcesPurged} resources and ${linksPurged} links`)
    } else {
      // Execute the actual purge using our database function
      const { data, error } = await supabase.rpc('manual_purge_all_deleted', { days })

      if (error) {
        console.error('Purge function error:', error)
        throw new Error(`Database purge failed: ${error.message}`)
      }

      resourcesPurged = data?.resources_purged ?? 0
      linksPurged = data?.links_purged ?? 0

      console.log(`Purged ${resourcesPurged} resources and ${linksPurged} links (threshold: ${days} days)`)
    }

    const result: PurgeResult = {
      success: true,
      resources_purged: resourcesPurged,
      links_purged: linksPurged,
      days_threshold: days,
      dry_run: dryRun,
      executed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Purge function error:', error)

    const result: PurgeResult = {
      success: false,
      resources_purged: 0,
      links_purged: 0,
      days_threshold: 30,
      dry_run: false,
      executed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
