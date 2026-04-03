import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface InvitationLookupRow {
  accepted_at: string | null
  email: string
  expires_at: string
  inviter_email: string | null
  inviter_name: string | null
  phase_assignments: Array<{
    workspace_id: string
    phase: string
    can_edit: boolean
  }> | null
  role: string
  team_name: string | null
  team_plan: string | null
}

/**
 * GET /api/team/invitations/details
 * Fetch invitation details by token (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get token from query params
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }

    const { data: invitation, error: invitationError } = await supabase
      .rpc('get_invitation_by_token', { p_token: token })
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 })
    }

    const invitationData = invitation as InvitationLookupRow

    // Check if expired
    const isExpired = new Date(invitationData.expires_at) < new Date()

    // Parse phase assignments to group by workspace
    const phaseAssignments = invitationData.phase_assignments || []

    // Fetch workspace details for phase assignments
    const workspaceIds = [...new Set(phaseAssignments.map((pa) => pa.workspace_id))]
    const { data: workspaces } = workspaceIds.length > 0
      ? await adminSupabase
          .from('workspaces')
          .select('id, name')
          .in('id', workspaceIds)
      : { data: [] as Array<{ id: string; name: string }> }

    const workspaceMap = new Map(workspaces?.map((w) => [w.id, w.name]) || [])

    // Group phases by workspace
    const workspaceAccess = workspaceIds.map((workspaceId) => ({
      name: workspaceMap.get(workspaceId) || 'Unknown Workspace',
      phases: phaseAssignments
        .filter((pa) => pa.workspace_id === workspaceId)
        .map((pa) => pa.phase),
    }))

    return NextResponse.json({
      team_name: invitationData.team_name || 'Unknown Team',
      team_plan: invitationData.team_plan || 'free',
      inviter_name: invitationData.inviter_name || null,
      inviter_email: invitationData.inviter_email || '',
      role: invitationData.role,
      workspaces: workspaceAccess,
      expires_at: invitationData.expires_at,
      is_expired: isExpired,
      accepted_at: invitationData.accepted_at,
      email: invitationData.email,
    })
  } catch (error) {
    console.error('Error in GET /api/team/invitations/details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
