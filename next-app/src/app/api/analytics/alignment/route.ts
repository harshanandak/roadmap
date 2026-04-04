/**
 * Strategy Alignment Analytics API
 * GET /api/analytics/alignment
 *
 * Returns strategy metrics, alignment rates, and progress by pillar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireTeamRouteContext, requireWorkspaceScope } from '@/lib/api/team-route'
import type { StrategyAlignmentData, PieChartData } from '@/lib/types/analytics'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const workspaceId = searchParams.get('workspace_id')
    const requestedTeamId = searchParams.get('team_id')
    const scope = searchParams.get('scope') || 'workspace'

    const workspaceScopeError = requireWorkspaceScope(scope, workspaceId)
    if (workspaceScopeError) {
      return workspaceScopeError
    }

    const teamContext = await requireTeamRouteContext({ requestedTeamId })
    if (!teamContext.ok) {
      return teamContext.response
    }
    const { supabase, teamId } = teamContext.context

    // Fetch strategies
    let strategiesQuery = supabase
      .from('product_strategies')
      .select('id, title, type, status, progress, calculated_progress, parent_id')
      .eq('team_id', teamId)

    if (scope === 'workspace' && workspaceId) {
      strategiesQuery = strategiesQuery.eq('workspace_id', workspaceId)
    }

    const { data: strategies, error: strategiesError } = await strategiesQuery

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError)
      return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 })
    }

    // Fetch work items with strategy alignment
    let workItemsQuery = supabase
      .from('work_items')
      .select('id, name, type, strategy_id')
      .eq('team_id', teamId)

    if (scope === 'workspace' && workspaceId) {
      workItemsQuery = workItemsQuery.eq('workspace_id', workspaceId)
    }

    const { data: workItems, error: workItemsError } = await workItemsQuery

    if (workItemsError) {
      console.error('Error fetching work items:', workItemsError)
      return NextResponse.json({ error: 'Failed to fetch work items' }, { status: 500 })
    }

    const strategyList = strategies || []
    const items = workItems || []

    // Calculate metrics
    const totalStrategies = strategyList.length

    // By Type
    const typeCounts: Record<string, number> = {}
    strategyList.forEach((s) => {
      const type = s.type || 'unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    const byType: PieChartData[] = Object.entries(typeCounts).map(([name, value]) => ({
      name: formatLabel(name),
      value,
    }))

    // By Status
    const statusCounts: Record<string, number> = {}
    strategyList.forEach((s) => {
      const status = s.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    const byStatus: PieChartData[] = Object.entries(statusCounts).map(([name, value]) => ({
      name: formatLabel(name),
      value,
    }))

    // Alignment metrics
    const alignedWorkItemCount = items.filter((i) => i.strategy_id).length
    const unalignedWorkItemCount = items.length - alignedWorkItemCount
    const alignmentRate =
      items.length > 0 ? Math.round((alignedWorkItemCount / items.length) * 100) : 0

    // Progress by pillar (top-level strategies)
    const pillars = strategyList.filter((s) => s.type === 'pillar' || !s.parent_id)
    const progressByPillar = pillars.map((pillar) => {
      // Count work items aligned to this pillar or its children
      const pillarIds = new Set<string>([pillar.id])

      // Add child strategy IDs
      strategyList.forEach((s) => {
        if (s.parent_id === pillar.id) {
          pillarIds.add(s.id)
        }
      })

      const workItemCount = items.filter((i) => i.strategy_id && pillarIds.has(i.strategy_id)).length

      return {
        id: pillar.id,
        name: pillar.title,
        progress: pillar.calculated_progress ?? pillar.progress ?? 0,
        workItemCount,
      }
    })

    // Unaligned items (items without strategy_id)
    const unalignedItems = items
      .filter((i) => !i.strategy_id)
      .slice(0, 10)
      .map((i) => ({
        id: i.id,
        name: i.name,
        type: i.type || 'unknown',
      }))

    const data: StrategyAlignmentData = {
      totalStrategies,
      byType,
      byStatus,
      alignedWorkItemCount,
      unalignedWorkItemCount,
      alignmentRate,
      progressByPillar,
      unalignedItems,
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Strategy alignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper: Format label
function formatLabel(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
