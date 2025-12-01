'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Plus, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  WorkBoardProvider,
  useWorkBoardContext,
  type FilterState,
} from './shared/filter-context'
import { WorkBoardTabs } from './work-board-tabs'
import { WorkBoardToolbar } from './work-board-toolbar'
import { ViewModeToggle } from './view-mode-toggle'
import { PageTransition } from './shared/page-transition'

// Import keyboard shortcuts
import { useWorkBoardShortcuts } from './hooks/use-work-board-shortcuts'
import { KeyboardHelpDialog } from './shared/keyboard-help-dialog'

// Import existing components for views
import { WorkItemsViewWrapper } from '@/components/work-items/work-items-view-wrapper'
import { TaskList } from '@/components/product-tasks'
import { WorkItemsBoardView } from './work-items-view/work-items-board-view'
import { NestedWorkItemsTable } from './work-items-view/nested-work-items-table'
import { type WorkItemStatus } from './shared/filter-context'
import { TimelineView, type TimelineWorkItem } from '@/components/timeline/timeline-view'
import { TasksTimelineView } from './tasks-view/tasks-timeline-view'

// Import dialogs for create actions
import { CreateTaskDialog } from '@/components/product-tasks/create-task-dialog'
import { CreateWorkItemDialog } from '@/components/work-items/create-work-item-dialog'


// Types
interface WorkItem {
  id: string
  name: string
  type: string
  status: string | null
  priority: string | null
  owner: string | null
  created_at: string | null
  [key: string]: unknown
}

interface TimelineItem {
  id: string
  work_item_id: string
  description: string | null
  timeline: string
  phase: string | null
  status: string | null
  [key: string]: unknown
}

interface Task {
  id: string
  title: string
  status: string
  task_type: string
  priority: string | null
  assigned_to: string | null
  work_item_id: string | null
  timeline_item_id: string | null
  [key: string]: unknown
}

interface TeamMember {
  id: string
  name: string
  email: string
}

interface DummyTask {
  id: string
  title: string
  status: string
  task_type: string
  priority: string | null
  assigned_to: string | null
  work_item_id: string | null
  timeline_item_id: string | null
  description?: string | null
  created_at?: string
  updated_at?: string
  workspace_id?: string
  team_id?: string
  [key: string]: unknown
}

interface WorkBoardShellProps {
  workspace: { id: string; team_id: string; name: string }
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  currentUserId: string
  teamMembers?: TeamMember[]
  className?: string
  dummyTasks?: DummyTask[]
  userEmail?: string
  userName?: string
}

// Inner component that uses the context
function WorkBoardContent({
  workspace,
  workItems,
  timelineItems,
  currentUserId,
  teamMembers = [],
  className,
  dummyTasks = [],
  userEmail,
  userName,
}: WorkBoardShellProps) {
  const { primaryTab, viewMode, filters, clearFilters, hasActiveFilters } = useWorkBoardContext()
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addWorkItemOpen, setAddWorkItemOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Keyboard shortcuts
  useWorkBoardShortcuts({
    onCreateTask: () => setAddTaskOpen(true),
    onCreateWorkItem: () => setAddWorkItemOpen(true),
    onShowHelp: () => setHelpDialogOpen(true),
    searchInputRef,
  })

  // Filter work items based on current filters
  const filteredWorkItems = useMemo(() => {
    let items = [...workItems]

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      items = items.filter(
        (item) =>
          item.name?.toLowerCase().includes(search) ||
          item.type?.toLowerCase().includes(search)
      )
    }

    // Status filter
    if (filters.status) {
      items = items.filter((item) => item.status === filters.status)
    }

    // Type filter
    if (filters.type) {
      items = items.filter((item) => item.type === filters.type)
    }

    // Priority filter
    if (filters.priority) {
      items = items.filter((item) => item.priority === filters.priority)
    }

    // Assignee filter
    if (filters.assignee) {
      if (filters.assignee === 'unassigned') {
        items = items.filter((item) => !item.owner)
      } else {
        items = items.filter((item) => item.owner === filters.assignee)
      }
    }

    return items
  }, [workItems, filters])

  // Calculate counts
  const workItemCount = workItems.length
  const taskCount = 0 // Will be fetched in TaskList

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Row: Title + Create Buttons */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Work Board</h2>
          <p className="text-muted-foreground text-sm">
            Manage your work items and tasks in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddTaskOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
          <CreateWorkItemDialog
            workspaceId={workspace.id}
            teamId={workspace.team_id}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      {/* Navigation Row: Tabs + View Mode Toggle */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b">
        <WorkBoardTabs workItemCount={workItemCount} taskCount={taskCount} />
        <ViewModeToggle />
      </div>

      {/* Toolbar: Search + Filters + Keyboard Help */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <WorkBoardToolbar teamMembers={teamMembers} searchInputRef={searchInputRef} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setHelpDialogOpen(true)}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </div>

      {/* Content Area with page transitions */}
      <div className="min-h-[400px]">
        <PageTransition viewKey={`${primaryTab}-${viewMode}`}>
          {primaryTab === 'work-items' ? (
            <WorkItemsContent
              workspace={workspace}
              workItems={filteredWorkItems}
              timelineItems={timelineItems}
              currentUserId={currentUserId}
              viewMode={viewMode}
              onAddItem={() => setAddWorkItemOpen(true)}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <TasksContent
              workspace={workspace}
              viewMode={viewMode}
              filters={filters}
              dummyTasks={dummyTasks}
            />
          )}
        </PageTransition>
      </div>

      {/* Add Task Dialog */}
      <CreateTaskDialog
        workspaceId={workspace.id}
        teamId={workspace.team_id}
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        onSuccess={() => router.refresh()}
      />

      {/* Create Work Item Dialog (keyboard shortcut N) */}
      <CreateWorkItemDialog
        workspaceId={workspace.id}
        teamId={workspace.team_id}
        currentUserId={currentUserId}
        open={addWorkItemOpen}
        onOpenChange={setAddWorkItemOpen}
      />

      {/* Keyboard Help Dialog */}
      <KeyboardHelpDialog
        open={helpDialogOpen}
        onOpenChange={setHelpDialogOpen}
      />
    </div>
  )
}

// Work Items Content based on view mode
interface WorkItemsContentProps {
  workspace: { id: string; team_id: string; name: string }
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  currentUserId: string
  viewMode: 'table' | 'board' | 'timeline'
  onAddItem?: () => void
  hasActiveFilters?: boolean
  onClearFilters?: () => void
}

function WorkItemsContent({
  workspace,
  workItems,
  timelineItems,
  currentUserId,
  viewMode,
  onAddItem,
  hasActiveFilters = false,
  onClearFilters,
}: WorkItemsContentProps) {
  // Get column visibility and navigation from context
  const { preferences, navigateToTasksForWorkItem } = useWorkBoardContext()

  if (viewMode === 'table') {
    // Use new NestedWorkItemsTable for hierarchical table view
    // Pass column visibility from context (persisted to localStorage)
    return (
      <NestedWorkItemsTable
        workItems={workItems}
        timelineItems={timelineItems}
        workspaceId={workspace.id}
        columnVisibility={preferences.columnVisibility}
        onAddItem={onAddItem}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    )
  }

  if (viewMode === 'board') {
    // Work Items Kanban Board
    const handleStatusChange = async (itemId: string, newStatus: WorkItemStatus) => {
      try {
        const response = await fetch(`/api/work-items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (!response.ok) {
          throw new Error('Failed to update status')
        }
        // Refresh the page to get updated data
        window.location.reload()
      } catch (error) {
        console.error('Error updating work item status:', error)
        throw error
      }
    }

    return (
      <WorkItemsBoardView
        workItems={workItems}
        timelineItems={timelineItems}
        workspaceId={workspace.id}
        onStatusChange={handleStatusChange}
        onTaskCountClick={navigateToTasksForWorkItem}
        onAddItem={onAddItem ? () => onAddItem() : undefined}
      />
    )
  }

  if (viewMode === 'timeline') {
    // Transform timeline items into TimelineWorkItem format for the Gantt chart
    // Each timeline item represents a MVP/SHORT/LONG breakdown with its own dates
    const timelineWorkItems: TimelineWorkItem[] = timelineItems.map(ti => {
      const parentWorkItem = workItems.find(wi => wi.id === ti.work_item_id)
      return {
        id: ti.id,
        name: parentWorkItem?.name || ti.description || 'Untitled',
        timeline_phase: (ti.timeline as 'MVP' | 'SHORT' | 'LONG') || 'MVP',
        status: ti.status || parentWorkItem?.status || 'planned',
        priority: parentWorkItem?.priority || undefined,
        planned_start_date: (ti as any).planned_start_date || undefined,
        planned_end_date: (ti as any).planned_end_date || undefined,
        duration_days: undefined, // Will be calculated
        dependencies: [], // TODO: Wire up linked_items as dependencies
        assignee: parentWorkItem?.owner || undefined,
        team: undefined,
      }
    })

    return (
      <TimelineView
        workItems={timelineWorkItems}
        workspaceId={workspace.id}
        teamId={workspace.team_id}
        currentUserId={currentUserId}
      />
    )
  }

  return null
}

// Tasks Content based on view mode
interface TasksContentProps {
  workspace: { id: string; team_id: string; name: string }
  viewMode: 'table' | 'board' | 'timeline'
  filters: FilterState
  dummyTasks?: DummyTask[]
}

function TasksContent({ workspace, viewMode, filters, dummyTasks = [] }: TasksContentProps) {
  // Get navigation function from context for cross-view navigation
  const { navigateToWorkItem } = useWorkBoardContext()

  // Use TasksTimelineView for timeline mode
  if (viewMode === 'timeline') {
    return (
      <TasksTimelineView
        workspaceId={workspace.id}
        teamId={workspace.team_id}
        externalSearch={filters.search}
        externalStatusFilter={filters.status as 'todo' | 'in_progress' | 'done' | 'all' || 'all'}
        externalTypeFilter={filters.type as 'research' | 'design' | 'development' | 'qa' | 'marketing' | 'ops' | 'admin' | 'all' || 'all'}
      />
    )
  }

  // TaskList supports 'board' and 'list' views
  // Map Work Board viewMode: 'table' -> 'table', 'board' -> 'board'
  // Hide internal filters/header since Work Board provides unified controls
  // Pass external filters from Work Board context
  return (
    <TaskList
      workspaceId={workspace.id}
      teamId={workspace.team_id}
      title=""
      showStats={false}
      showCreateButton={false}
      showFilters={false}
      showHeader={false}
      externalSearch={filters.search}
      externalStatusFilter={filters.status as 'todo' | 'in_progress' | 'done' | 'all' || 'all'}
      externalTypeFilter={filters.type as 'research' | 'design' | 'development' | 'qa' | 'marketing' | 'ops' | 'admin' | 'all' || 'all'}
      externalViewMode={viewMode}
      dummyTasks={dummyTasks as any}
      onWorkItemClick={navigateToWorkItem}
    />
  )
}

// Main exported component with provider
export function WorkBoardShell(props: WorkBoardShellProps) {
  return (
    <WorkBoardProvider
      workspaceId={props.workspace.id}
      defaultTab="work-items"
      defaultView="table"
    >
      <WorkBoardContent {...props} />
    </WorkBoardProvider>
  )
}

// Export types for use in other components
export type { WorkItem, TimelineItem, Task, TeamMember, WorkBoardShellProps, DummyTask }
