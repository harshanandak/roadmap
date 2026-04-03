/**
 * Integration Management API
 *
 * GET  /api/integrations - List team integrations
 * POST /api/integrations - Create/initiate new integration
 *
 * All integrations are scoped to the authenticated user's team.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveTeam } from '@/lib/teams/active-team'
import { mcpGateway } from '@/lib/ai/mcp'
import {
  isNativeOAuthSupported,
  isOAuthConfigured,
  initOAuth,
  generateOAuthState,
  getMissingEnvVars,
} from '@/lib/integrations/oauth-providers'
import type { IntegrationProvider, IntegrationDisplay, CreateIntegrationResponse } from '@/lib/types/integrations'

/**
 * GET /api/integrations
 *
 * List all integrations for the authenticated user's team.
 *
 * Query params:
 * - status: Filter by status (connected, expired, error)
 * - provider: Filter by provider (github, jira, etc.)
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
    const teamId = activeTeamId

    // Parse query params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const providerFilter = searchParams.get('provider')

    // Build query
    let query = supabase
      .from('organization_integrations')
      .select(`
        id,
        provider,
        name,
        status,
        scopes,
        provider_account_name,
        provider_avatar_url,
        last_sync_at,
        last_error,
        created_at
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }
    if (providerFilter) {
      query = query.eq('provider', providerFilter)
    }

    const { data: integrations, error: queryError } = await query

    if (queryError) {
      console.error('[Integrations API] Query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
    }

    // Transform to display format (no tokens)
    const displayIntegrations: IntegrationDisplay[] = (integrations || []).map((int) => ({
      id: int.id,
      provider: int.provider as IntegrationProvider,
      name: int.name,
      status: int.status,
      providerAccountName: int.provider_account_name,
      providerAvatarUrl: int.provider_avatar_url,
      scopes: int.scopes || [],
      lastSyncAt: int.last_sync_at,
      lastError: int.last_error,
      createdAt: int.created_at,
    }))

    return NextResponse.json({
      integrations: displayIntegrations,
      count: displayIntegrations.length,
    })
  } catch (error) {
    console.error('[Integrations API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/integrations
 *
 * Create a new integration and initiate OAuth flow.
 *
 * Request body:
 * - provider: IntegrationProvider (required)
 * - name: string (optional, defaults to provider name)
 * - scopes: string[] (optional, uses provider defaults)
 */
export async function POST(request: NextRequest) {
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
    const teamId = activeTeamId

    // Parse request body
    const body = await request.json()
    const { provider, name, scopes } = body as {
      provider: IntegrationProvider
      name?: string
      scopes?: string[]
    }

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    // Create pending integration record
    const integrationId = Date.now().toString()
    const integrationName = name || provider.charAt(0).toUpperCase() + provider.slice(1)

    const { error: insertError } = await supabase
      .from('organization_integrations')
      .insert({
        id: integrationId,
        team_id: teamId,
        provider,
        name: integrationName,
        status: 'pending',
        scopes: scopes || [],
        metadata: {},
        created_by: user.id,
      })

    if (insertError) {
      console.error('[Integrations API] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
    }

    // Build OAuth redirect URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // Use provider-specific callback for native OAuth
    const redirectUri = `${appUrl}/api/integrations/oauth/callback/${provider}`

    // ==========================================================================
    // STRATEGY 1: Try Native OAuth first (no Docker required)
    // ==========================================================================
    if (isNativeOAuthSupported(provider)) {
      if (isOAuthConfigured(provider)) {
        // Native OAuth is available and configured
        const state = generateOAuthState()
        const oauthResult = initOAuth(provider, redirectUri, state, scopes)

        if (oauthResult) {
          // Update integration with state for callback matching
          await supabase
            .from('organization_integrations')
            .update({
              scopes: oauthResult.scopes,
              metadata: {
                oauth_state: state,
                integration_id: integrationId,
                team_id: teamId,
              },
            })
            .eq('id', integrationId)

          console.log(`[Integrations API] Using native OAuth for ${provider}`)

          const response: CreateIntegrationResponse = {
            integration: {
              id: integrationId,
              provider,
              name: integrationName,
              status: 'pending',
              scopes: oauthResult.scopes,
              createdAt: new Date().toISOString(),
            },
            oauthUrl: oauthResult.oauthUrl,
          }

          return NextResponse.json(response, { status: 201 })
        }
      } else {
        // Provider is supported but not configured - return helpful error
        const missingVars = getMissingEnvVars(provider)
        console.warn(`[Integrations API] ${provider} OAuth not configured. Missing: ${missingVars.join(', ')}`)

        // Delete the pending integration since we can't proceed
        await supabase.from('organization_integrations').delete().eq('id', integrationId)

        return NextResponse.json(
          {
            error: `${provider} OAuth not configured`,
            details: `Please add the following environment variables: ${missingVars.join(', ')}`,
            missingEnvVars: missingVars,
          },
          { status: 503 }
        )
      }
    }

    // ==========================================================================
    // STRATEGY 2: Fall back to MCP Gateway (requires Docker)
    // ==========================================================================
    try {
      // Initialize OAuth via MCP Gateway
      const oauthResponse = await mcpGateway.initOAuth(
        provider,
        teamId,
        `${appUrl}/api/integrations/oauth/callback`, // Use generic callback for MCP
        scopes
      )

      // Update integration with state for callback matching
      await supabase
        .from('organization_integrations')
        .update({
          metadata: { oauth_state: oauthResponse.state },
        })
        .eq('id', integrationId)

      console.log(`[Integrations API] Using MCP Gateway for ${provider}`)

      const response: CreateIntegrationResponse = {
        integration: {
          id: integrationId,
          provider,
          name: integrationName,
          status: 'pending',
          scopes: oauthResponse.scopes,
          createdAt: new Date().toISOString(),
        },
        oauthUrl: oauthResponse.oauthUrl,
      }

      return NextResponse.json(response, { status: 201 })
    } catch (gatewayError) {
      // Gateway unavailable - mark integration as error and return proper error status
      console.error('[Integrations API] Gateway unavailable:', gatewayError)

      // Update the integration status to 'error' so it doesn't stay in pending
      await supabase
        .from('organization_integrations')
        .update({
          status: 'error',
          last_error: 'OAuth service unavailable. Neither native OAuth nor MCP Gateway is available.',
        })
        .eq('id', integrationId)

      // Return 503 Service Unavailable so frontend can show error
      return NextResponse.json(
        {
          error: 'OAuth service unavailable',
          details: `No OAuth method available for ${provider}. Configure environment variables or start the MCP Gateway Docker container.`,
          integration: {
            id: integrationId,
            provider,
            name: integrationName,
            status: 'error',
          },
        },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('[Integrations API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
