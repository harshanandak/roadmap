/**
 * Dependency Health Analytics API
 * GET /api/analytics/dependencies
 *
 * Returns dependency metrics including health score, blocked items,
 * and raw data for client-side critical path calculation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAnalyticsRouteContext } from '@/lib/api/analytics-route'
import type { DependencyHealthData, PieChartData } from '@/lib/types/analytics'

export async function GET(req: NextRequest) {
  try {
    const routeContext = await requireAnalyticsRouteContext(req)
    if (!routeContext.ok) {
      return routeContext.response
    }
    const { scope, supabase, teamId, workspaceId } = routeContext.context

    // Fetch work items
    let workItemsQuery = supabase
      .from('work_items')
      .select('id, name, status')
      .eq('team_id', teamId)

    if (scope === 'workspace' && workspaceId) {
      workItemsQuery = workItemsQuery.eq('workspace_id', workspaceId)
    }

    const { data: workItems, error: workItemsError } = await workItemsQuery

    if (workItemsError) {
      console.error('Error fetching work items:', workItemsError)
      return NextResponse.json({ error: 'Failed to fetch work items' }, { status: 500 })
    }

    // Get work item IDs for filtering connections
    const workItemIds = (workItems || []).map((wi) => wi.id)

    // Fetch connections (dependencies)
    const { data: connections, error: connectionsError } = await supabase
      .from('work_item_connections')
      .select('id, source_work_item_id, target_work_item_id, connection_type, status')
      .eq('status', 'active')
      .in('source_work_item_id', workItemIds.length > 0 ? workItemIds : [''])

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError)
      // Continue without connections data
    }

    const deps = connections || []
    const items = workItems || []

    // Calculate metrics
    const totalDependencies = deps.length

    // Count blocked items (items with status 'blocked' OR items that have blocking dependencies)
    const blockedItemIds = new Set<string>()

    // Items explicitly marked as blocked
    items.forEach((item) => {
      if (item.status === 'blocked') {
        blockedItemIds.add(item.id)
      }
    })

    // Items blocked by incomplete dependencies
    deps.forEach((dep) => {
      if (dep.connection_type === 'blocks' || dep.connection_type === 'dependency') {
        const sourceItem = items.find((i) => i.id === dep.source_work_item_id)
        if (sourceItem && sourceItem.status !== 'completed') {
          blockedItemIds.add(dep.target_work_item_id)
        }
      }
    })

    const blockedCount = blockedItemIds.size

    // By connection type
    const typeCounts: Record<string, number> = {}
    deps.forEach((dep) => {
      const type = dep.connection_type || 'unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    const byType: PieChartData[] = Object.entries(typeCounts).map(([name, value]) => ({
      name: formatLabel(name),
      value,
    }))

    // Calculate dependency counts per item
    const incomingDeps: Record<string, string[]> = {}
    const outgoingDeps: Record<string, string[]> = {}

    deps.forEach((dep) => {
      // Incoming = dependencies that block this item
      if (!incomingDeps[dep.target_work_item_id]) {
        incomingDeps[dep.target_work_item_id] = []
      }
      incomingDeps[dep.target_work_item_id].push(dep.source_work_item_id)

      // Outgoing = items this blocks
      if (!outgoingDeps[dep.source_work_item_id]) {
        outgoingDeps[dep.source_work_item_id] = []
      }
      outgoingDeps[dep.source_work_item_id].push(dep.target_work_item_id)
    })

    // Blocked items list (items that are blocked by others)
    const blockedItems = items
      .filter((item) => blockedItemIds.has(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        blockedBy: incomingDeps[item.id] || [],
        blockedByCount: (incomingDeps[item.id] || []).length,
      }))
      .sort((a, b) => b.blockedByCount - a.blockedByCount)
      .slice(0, 10)

    // Risk items (items with many dependencies - potential bottlenecks)
    const riskItems = items
      .map((item) => {
        const depCount = (incomingDeps[item.id] || []).length + (outgoingDeps[item.id] || []).length
        const riskScore = calculateRiskScore(depCount, item.status)
        return {
          id: item.id,
          name: item.name,
          dependencyCount: depCount,
          riskScore,
        }
      })
      .filter((item) => item.riskScore > 30) // Only show items with risk
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)

    // Calculate critical path (simplified - just find longest chain)
    const criticalPath = calculateSimpleCriticalPath(items, deps)

    // Calculate health score
    const healthScore = calculateHealthScore(items, deps, blockedCount)

    const data: DependencyHealthData = {
      totalDependencies,
      blockedCount,
      byType,
      healthScore,
      criticalPath,
      blockedItems,
      riskItems,
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Dependency health error:', error)
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

// Helper: Calculate risk score (0-100)
function calculateRiskScore(dependencyCount: number, status: string): number {
  let score = 0

  // More dependencies = higher risk
  score += Math.min(dependencyCount * 15, 60)

  // Status factors
  if (status === 'blocked') score += 30
  else if (status === 'not_started') score += 10

  return Math.min(score, 100)
}

// Helper: Calculate simple critical path
function calculateSimpleCriticalPath(
  items: Array<{ id: string; name: string; status: string }>,
  deps: Array<{ source_work_item_id: string; target_work_item_id: string }>
): { length: number; items: Array<{ id: string; name: string }> } {
  if (items.length === 0 || deps.length === 0) {
    return { length: 0, items: [] }
  }

  // Build adjacency list
  const graph: Record<string, string[]> = {}
  items.forEach((item) => {
    graph[item.id] = []
  })
  deps.forEach((dep) => {
    if (graph[dep.source_work_item_id]) {
      graph[dep.source_work_item_id].push(dep.target_work_item_id)
    }
  })

  // Find longest path using DFS
  const visited = new Set<string>()
  let longestPath: string[] = []

  function dfs(nodeId: string, path: string[]): void {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    const newPath = [...path, nodeId]
    if (newPath.length > longestPath.length) {
      longestPath = newPath
    }

    const neighbors = graph[nodeId] || []
    for (const neighbor of neighbors) {
      dfs(neighbor, newPath)
    }

    visited.delete(nodeId)
  }

  // Start DFS from each node
  items.forEach((item) => {
    dfs(item.id, [])
  })

  // Map to items
  const pathItems = longestPath
    .map((id) => {
      const item = items.find((i) => i.id === id)
      return item ? { id: item.id, name: item.name } : null
    })
    .filter(Boolean) as Array<{ id: string; name: string }>

  return {
    length: pathItems.length,
    items: pathItems,
  }
}

// Helper: Calculate health score (0-100)
function calculateHealthScore(
  items: Array<{ status: string }>,
  deps: Array<unknown>,
  blockedCount: number
): number {
  if (items.length === 0) return 100

  let score = 100

  // Deduct for blocked items (up to 40 points)
  const blockedRatio = blockedCount / items.length
  score -= Math.min(blockedRatio * 100, 40)

  // Deduct for too many dependencies (up to 20 points)
  const avgDepsPerItem = deps.length / items.length
  if (avgDepsPerItem > 3) {
    score -= Math.min((avgDepsPerItem - 3) * 5, 20)
  }

  // Bonus for completed items (up to 20 points)
  const completedRatio = items.filter((i) => i.status === 'completed').length / items.length
  score += completedRatio * 20

  return Math.max(0, Math.min(100, Math.round(score)))
}
