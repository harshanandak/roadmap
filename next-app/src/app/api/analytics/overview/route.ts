/**
 * Feature Overview Analytics API
 * GET /api/analytics/overview
 *
 * Returns work items aggregated by status, type, phase, and priority
 * with completion trend over time.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireTeamRouteContext, requireWorkspaceScope } from '@/lib/api/team-route'
import type {
  FeatureOverviewData,
  PieChartData,
  LineChartData,
  ActivityItem,
} from '@/lib/types/analytics'
import { STATUS_COLORS, PRIORITY_COLORS, PHASE_COLORS } from '@/lib/types/analytics'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const workspaceId = searchParams.get('workspace_id')
    const requestedTeamId = searchParams.get('team_id')
    const scope = searchParams.get('scope') || 'workspace'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const workspaceScopeError = requireWorkspaceScope(scope, workspaceId)
    if (workspaceScopeError) {
      return workspaceScopeError
    }

    const teamContext = await requireTeamRouteContext({ requestedTeamId })
    if (!teamContext.ok) {
      return teamContext.response
    }
    const { supabase, teamId } = teamContext.context

    // Build query based on scope
    let query = supabase
      .from('work_items')
      .select('id, name, type, status, priority, phase, created_at, updated_at')
      .eq('team_id', teamId)

    // Filter by workspace if scope is 'workspace'
    if (scope === 'workspace' && workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    // Apply date filters if provided
    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const { data: workItems, error } = await query

    if (error) {
      console.error('Error fetching work items:', error)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    const items = workItems || []

    // Calculate metrics
    const totalWorkItems = items.length

    // By Status
    const statusCounts: Record<string, number> = {}
    items.forEach((item) => {
      const status = item.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    const byStatus: PieChartData[] = Object.entries(statusCounts).map(([name, value]) => ({
      name: formatLabel(name),
      value,
      color: STATUS_COLORS[name] || '#6b7280',
    }))

    // By Type
    const typeCounts: Record<string, number> = {}
    items.forEach((item) => {
      const type = item.type || 'unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    const byType: PieChartData[] = Object.entries(typeCounts).map(([name, value]) => ({
      name: formatLabel(name),
      value,
    }))

    // By Phase
    const phaseCounts: Record<string, number> = {}
    items.forEach((item) => {
      const phase = item.phase || 'unknown'
      phaseCounts[phase] = (phaseCounts[phase] || 0) + 1
    })
    const byPhase: PieChartData[] = Object.entries(phaseCounts).map(([name, value]) => ({
      name: formatLabel(name),
      value,
      color: PHASE_COLORS[name] || '#6b7280',
    }))

    // By Priority
    const priorityCounts: Record<string, number> = {}
    items.forEach((item) => {
      const priority = item.priority || 'medium'
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1
    })
    const byPriority: PieChartData[] = Object.entries(priorityCounts).map(([name, value]) => ({
      name: formatLabel(name),
      value,
      color: PRIORITY_COLORS[name] || '#6b7280',
    }))

    // Completion Rate
    const completedCount = items.filter((i) => i.status === 'completed').length
    const completionRate = totalWorkItems > 0 ? Math.round((completedCount / totalWorkItems) * 100) : 0

    // Completion Trend (last 12 weeks)
    const completionTrend = calculateWeeklyTrend(items, 12)

    // Recent Activity (last 10 items by updated_at)
    const recentActivity: ActivityItem[] = items
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        type: getActivityType(item.status),
        workItemId: item.id,
        workItemName: item.name,
        timestamp: item.updated_at,
      }))

    const data: FeatureOverviewData = {
      totalWorkItems,
      byStatus,
      byType,
      byPhase,
      byPriority,
      completionTrend,
      completionRate,
      recentActivity,
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feature overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper: Format label (snake_case to Title Case)
function formatLabel(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper: Calculate weekly completion trend
function calculateWeeklyTrend(
  items: Array<{ status: string; updated_at: string }>,
  weeks: number
): LineChartData[] {
  const trend: LineChartData[] = []
  const now = new Date()

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - i * 7)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = items.filter((item) => {
      const date = new Date(item.updated_at)
      return item.status === 'completed' && date >= weekStart && date < weekEnd
    }).length

    trend.push({
      date: weekStart.toISOString().split('T')[0],
      value: count,
    })
  }

  return trend
}

// Helper: Get activity type from status
function getActivityType(status: string): ActivityItem['type'] {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'blocked':
      return 'blocked'
    case 'in_progress':
      return 'updated'
    default:
      return 'created'
  }
}
