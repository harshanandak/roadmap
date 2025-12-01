'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Filter, LayoutGrid, List, RefreshCw, MoreHorizontal, Clock, AlertTriangle, CheckCircle2, Circle, Link2, ExternalLink } from 'lucide-react'
import { TaskCard } from './task-card'
import { CreateTaskDialog } from './create-task-dialog'
import { TasksEmptyState } from '@/components/work-board/shared/empty-state'
import { staggerContainerVariants, staggerItemVariants, columnContainerVariants, boardCardVariants } from '@/components/work-board/shared/animation-variants'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ProductTaskWithRelations,
  TaskStatus,
  TaskType,
  TaskStats,
  TASK_TYPE_CONFIG,
  TASK_STATUS_CONFIG,
} from '@/lib/types/product-tasks'

interface TaskListProps {
  workspaceId: string
  teamId: string
  workItemId?: string | null // If provided, show only tasks linked to this work item (feature level)
  timelineItemId?: string | null // If provided, show only tasks linked to this timeline item (MVP/SHORT/LONG level)
  timelineItemName?: string | null // For display in create dialog
  title?: string
  showStats?: boolean
  showCreateButton?: boolean
  showFilters?: boolean // Show internal search/filter controls (default true)
  showHeader?: boolean // Show header with title and stats (default true)
  className?: string
  // External filter props (used when embedded in Work Board)
  externalSearch?: string
  externalStatusFilter?: TaskStatus | 'all'
  externalTypeFilter?: TaskType | 'all'
  // External view mode control (used when embedded in Work Board)
  // Maps: 'table'/'timeline' -> 'list', 'board' -> 'board'
  externalViewMode?: 'board' | 'list' | 'table' | 'timeline'
  // Dummy tasks for testing (merged with fetched tasks)
  dummyTasks?: ProductTaskWithRelations[]
  // Cross-view navigation handler (navigate to work item in Work Board)
  onWorkItemClick?: (workItemId: string) => void
}

export function TaskList({
  workspaceId,
  teamId,
  workItemId,
  timelineItemId,
  timelineItemName,
  title = 'Tasks',
  showStats = true,
  showCreateButton = true,
  showFilters = true,
  showHeader = true,
  className,
  externalSearch,
  externalStatusFilter,
  externalTypeFilter,
  externalViewMode,
  dummyTasks = [],
  onWorkItemClick,
}: TaskListProps) {
  const [fetchedTasks, setFetchedTasks] = useState<ProductTaskWithRelations[]>([])

  // Merge dummy tasks with fetched tasks
  const tasks = dummyTasks.length > 0 ? [...dummyTasks, ...fetchedTasks] : fetchedTasks
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all')
  const [internalViewMode, setInternalViewMode] = useState<'board' | 'list' | 'table'>('board')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Use external view mode when provided
  // Maps: 'timeline' -> 'list', 'board' -> 'board', 'table' -> 'table', 'list' -> 'list'
  const viewMode: 'board' | 'list' | 'table' = externalViewMode !== undefined
    ? (externalViewMode === 'board' ? 'board' : externalViewMode === 'table' ? 'table' : 'list')
    : internalViewMode
  const setViewMode = setInternalViewMode

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        team_id: teamId,
      })
      if (workItemId) {
        params.set('work_item_id', workItemId)
      }
      if (timelineItemId) {
        params.set('timeline_item_id', timelineItemId)
      }

      const response = await fetch(`/api/product-tasks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tasks')

      const data = await response.json()
      setFetchedTasks(data.data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, teamId, workItemId, timelineItemId])

  const fetchStats = useCallback(async () => {
    if (!showStats) return
    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        team_id: teamId,
      })

      const response = await fetch(`/api/product-tasks/stats?${params}`)
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [workspaceId, teamId, showStats])

  useEffect(() => {
    fetchTasks()
    fetchStats()
  }, [fetchTasks, fetchStats])

  // Use external filters when provided, otherwise use internal state
  const effectiveSearch = externalSearch !== undefined ? externalSearch : searchQuery
  const effectiveStatusFilter = externalStatusFilter !== undefined ? externalStatusFilter : statusFilter
  const effectiveTypeFilter = externalTypeFilter !== undefined ? externalTypeFilter : typeFilter

  // Check if any filters are active (for distinguishing empty states)
  const hasActiveFilters = Boolean(
    effectiveSearch ||
    effectiveStatusFilter !== 'all' ||
    effectiveTypeFilter !== 'all'
  )

  // Clear internal filters (only works when not using external filters)
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setStatusFilter('all')
    setTypeFilter('all')
  }, [])

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !effectiveSearch ||
      task.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      task.description?.toLowerCase().includes(effectiveSearch.toLowerCase())

    const matchesStatus = effectiveStatusFilter === 'all' || task.status === effectiveStatusFilter
    const matchesType = effectiveTypeFilter === 'all' || task.task_type === effectiveTypeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Group tasks by status for board view
  const tasksByStatus: Record<TaskStatus, ProductTaskWithRelations[]> = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  }

  const handleTaskUpdate = () => {
    fetchTasks()
    fetchStats()
  }

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setFetchedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    fetchStats()
  }

  const handleDelete = (taskId: string) => {
    setFetchedTasks((prev) => prev.filter((t) => t.id !== taskId))
    fetchStats()
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {stats && (
              <Badge variant="secondary">
                {stats.total} tasks ({stats.completion_percentage}% done)
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                fetchTasks()
                fetchStats()
              }}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {showCreateButton && (
              <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Stats bar */}
      {showStats && stats && stats.total > 0 && (
        <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-sm text-muted-foreground">
              To Do: {stats.by_status.todo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm text-muted-foreground">
              In Progress: {stats.by_status.in_progress}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">
              Done: {stats.by_status.done}
            </span>
          </div>
          {stats.overdue_count > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-sm text-red-600 font-medium">
                Overdue: {stats.overdue_count}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}
          >
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.keys(TASK_STATUS_CONFIG) as TaskStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {TASK_STATUS_CONFIG[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as TaskType | 'all')}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.keys(TASK_TYPE_CONFIG) as TaskType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {TASK_TYPE_CONFIG[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'board' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Task display */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <TasksEmptyState
          hasFilters={hasActiveFilters}
          onAction={showCreateButton ? () => setCreateDialogOpen(true) : undefined}
          onClearFilters={clearFilters}
        />
      ) : viewMode === 'table' ? (
        /* Table view */
        <div className="rounded-md border">
          <Table className="w-auto">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[250px] pl-4">Task</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[100px]">Priority</TableHead>
                <TableHead className="w-[150px]">Work Item</TableHead>
                <TableHead className="w-[120px]">Assigned To</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id} className="group hover:bg-muted/50">
                  <TableCell className="py-3 pl-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{task.title}</span>
                      {task.description && (
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        task.status === 'todo' && 'border-gray-300 text-gray-600',
                        task.status === 'in_progress' && 'border-blue-300 bg-blue-50 text-blue-700',
                        task.status === 'done' && 'border-green-300 bg-green-50 text-green-700'
                      )}
                    >
                      {task.status === 'todo' && <Circle className="h-3 w-3 mr-1" />}
                      {task.status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
                      {task.status === 'done' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {TASK_STATUS_CONFIG[task.status]?.label || task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="secondary" className="text-xs">
                      {TASK_TYPE_CONFIG[task.task_type]?.label || task.task_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    {task.priority ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          task.priority === 'critical' && 'border-red-300 bg-red-50 text-red-700',
                          task.priority === 'high' && 'border-orange-300 bg-orange-50 text-orange-700',
                          task.priority === 'medium' && 'border-yellow-300 bg-yellow-50 text-yellow-700',
                          task.priority === 'low' && 'border-green-300 bg-green-50 text-green-700'
                        )}
                      >
                        {task.priority === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {task.work_item ? (
                      <button
                        onClick={() => onWorkItemClick?.(task.work_item!.id)}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md',
                          'bg-secondary/50 hover:bg-secondary transition-colors',
                          onWorkItemClick && 'cursor-pointer group/link'
                        )}
                        disabled={!onWorkItemClick}
                        title={onWorkItemClick ? `Go to: ${task.work_item.name}` : task.work_item.name}
                      >
                        <Link2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{task.work_item.name}</span>
                        {onWorkItemClick && (
                          <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        )}
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground">
                      {task.assigned_to || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'todo')}>
                          Mark as To Do
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'done')}>
                          Mark as Done
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(task.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : viewMode === 'board' ? (
        /* Board view - Kanban style with staggered animations */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(tasksByStatus) as TaskStatus[]).map((status) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    status === 'todo' && 'bg-gray-400',
                    status === 'in_progress' && 'bg-blue-500',
                    status === 'done' && 'bg-green-500'
                  )}
                />
                <span className="font-medium text-sm">
                  {TASK_STATUS_CONFIG[status].label}
                </span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {tasksByStatus[status].length}
                </Badge>
              </div>

              <motion.div
                className="space-y-2 min-h-[100px] p-2 bg-muted/30 rounded-lg"
                variants={columnContainerVariants}
                initial="hidden"
                animate="visible"
                key={`task-column-${status}-${tasksByStatus[status].length}`}
              >
                {tasksByStatus[status].map((task) => (
                  <motion.div key={task.id} variants={boardCardVariants}>
                    <TaskCard
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onWorkItemClick={onWorkItemClick}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      ) : (
        /* List view with staggered animations */
        <motion.div
          className="space-y-2"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          key={`task-list-${filteredTasks.length}`}
        >
          {filteredTasks.map((task) => (
            <motion.div key={task.id} variants={staggerItemVariants}>
              <TaskCard
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onWorkItemClick={onWorkItemClick}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create dialog */}
      <CreateTaskDialog
        workspaceId={workspaceId}
        teamId={teamId}
        workItemId={workItemId}
        timelineItemId={timelineItemId}
        timelineItemName={timelineItemName}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleTaskUpdate}
      />
    </div>
  )
}
