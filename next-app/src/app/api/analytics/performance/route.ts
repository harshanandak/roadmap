/**
 * Team Performance Analytics API
 * GET /api/analytics/performance
 *
 * Returns task metrics, velocity trends, and team workload distribution.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireTeamRouteContext, requireWorkspaceScope } from '@/lib/api/team-route'
import type {
  TeamPerformanceData,
  PieChartData,
  BarChartData,
  LineChartData,
} from '@/lib/types/analytics'
import { STATUS_COLORS } from '@/lib/types/analytics'

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

    // Fetch tasks
    let tasksQuery = supabase
      .from('product_tasks')
      .select('id, title, status, task_type, assigned_to, due_date, created_at, updated_at')
      .eq('team_id', teamId)

    if (scope === 'workspace' && workspaceId) {
      tasksQuery = tasksQuery.eq('workspace_id', workspaceId)
    }

    if (from) tasksQuery = tasksQuery.gte('created_at', from)
    if (to) tasksQuery = tasksQuery.lte('created_at', to)

    const { data: tasks, error: tasksError } = await tasksQuery

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Fetch team members for assignee names
    const { data: members } = await supabase
      .from('team_members')
      .select(`
        user_id,
        users:users!team_members_user_id_fkey(
          id,
          email,
          name
        )
      `)
      .eq('team_id', teamId)

    const memberMap: Record<string, string> = {}
    members?.forEach((m) => {
      // Handle Supabase join returning array or single object
      const usersData = m.users;
      const userInfo = Array.isArray(usersData) ? usersData[0] : usersData;
      if (userInfo && m.user_id) {
        memberMap[m.user_id] = userInfo.name || userInfo.email || 'Unknown'
      }
    })

    const items = tasks || []

    // Calculate metrics
    const totalTasks = items.length

    // By Status
    const statusCounts: Record<string, number> = {}
    items.forEach((task) => {
      const status = task.status || 'todo'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    const tasksByStatus: PieChartData[] = Object.entries(statusCounts).map(([name, value]) => ({
      name: formatLabel(name),
      value,
      color: STATUS_COLORS[name] || '#6b7280',
    }))

    // By Type
    const typeCounts: Record<string, number> = {}
    items.forEach((task) => {
      const type = task.task_type || 'other'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    const tasksByType: BarChartData[] = Object.entries(typeCounts).map(([name, value]) => ({
      name: formatLabel(name),
      value,
    }))

    // By Assignee
    const assigneeCounts: Record<string, number> = {}
    items.forEach((task) => {
      const assigneeId = task.assigned_to || 'unassigned'
      const assigneeName = assigneeId === 'unassigned' ? 'Unassigned' : memberMap[assigneeId] || 'Unknown'
      assigneeCounts[assigneeName] = (assigneeCounts[assigneeName] || 0) + 1
    })
    const tasksByAssignee: BarChartData[] = Object.entries(assigneeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // Overdue count
    const now = new Date()
    const overdueCount = items.filter((task) => {
      if (!task.due_date || task.status === 'done') return false
      return new Date(task.due_date) < now
    }).length

    // Completion rate
    const completedCount = items.filter((t) => t.status === 'done').length
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

    // Velocity trend (tasks completed per week, last 12 weeks)
    const velocityTrend = calculateVelocityTrend(items, 12)

    // Average cycle time (days from creation to completion)
    const avgCycleTimeDays = calculateAvgCycleTime(items)

    const data: TeamPerformanceData = {
      totalTasks,
      tasksByStatus,
      tasksByType,
      tasksByAssignee,
      overdueCount,
      completionRate,
      velocityTrend,
      avgCycleTimeDays,
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Team performance error:', error)
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

// Helper: Calculate velocity trend
function calculateVelocityTrend(
  tasks: Array<{ status: string; updated_at: string }>,
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

    const count = tasks.filter((task) => {
      const date = new Date(task.updated_at)
      return task.status === 'done' && date >= weekStart && date < weekEnd
    }).length

    trend.push({
      date: weekStart.toISOString().split('T')[0],
      value: count,
    })
  }

  return trend
}

// Helper: Calculate average cycle time in days
function calculateAvgCycleTime(
  tasks: Array<{ status: string; created_at: string; updated_at: string }>
): number {
  const completedTasks = tasks.filter((t) => t.status === 'done')

  if (completedTasks.length === 0) return 0

  const totalDays = completedTasks.reduce((sum, task) => {
    const created = new Date(task.created_at)
    const completed = new Date(task.updated_at)
    const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    return sum + days
  }, 0)

  return Math.round((totalDays / completedTasks.length) * 10) / 10 // Round to 1 decimal
}
