'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  CheckSquare,
  Plus,
  LayoutGrid,
  List,
  Table2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkItemDetailContext, type TabViewMode } from '../shared/detail-context'
import { TaskList } from '@/components/product-tasks'
import { CreateTaskDialog } from '@/components/product-tasks/create-task-dialog'

/**
 * Tasks Tab - Task management for this work item
 *
 * Wraps the existing TaskList component, pre-filtered to show
 * only tasks linked to this work item.
 *
 * Supports three view modes:
 * - Board (Kanban)
 * - List
 * - Table
 */
export function TasksTab() {
  const { workItem, preferences, setPreferences, counts } = useWorkItemDetailContext()
  const router = useRouter()

  // Create task dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // View mode from preferences
  const viewMode = preferences.tasksViewMode

  // Map our TabViewMode to TaskList's expected values
  const taskListViewMode = viewMode === 'timeline' ? 'board' : viewMode

  // Handle view mode change
  const handleViewModeChange = (value: string) => {
    if (value) {
      setPreferences({ tasksViewMode: value as TabViewMode })
    }
  }

  // Handle task creation success
  const handleTaskCreated = () => {
    router.refresh()
    setCreateDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Header with view toggle and create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Execution checklist for this work item
            </p>
          </div>
          {counts.tasks > 0 && (
            <Badge variant="secondary" className="ml-2">
              {counts.tasks} task{counts.tasks !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={handleViewModeChange}
            className="bg-muted p-1 rounded-lg"
          >
            <ToggleGroupItem
              value="board"
              aria-label="Board view"
              className="h-8 w-8 p-0 data-[state=on]:bg-background"
              title="Kanban Board"
            >
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label="List view"
              className="h-8 w-8 p-0 data-[state=on]:bg-background"
              title="List View"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="table"
              aria-label="Table view"
              className="h-8 w-8 p-0 data-[state=on]:bg-background"
              title="Table View"
            >
              <Table2 className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Create task button */}
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Task list - filtered by work_item_id */}
      <TaskList
        workspaceId={workItem.workspace_id}
        teamId={workItem.team_id}
        title=""
        showStats={false}
        showCreateButton={false}
        showFilters={false}
        showHeader={false}
        // Filter to only show tasks linked to this work item
        workItemId={workItem.id}
        externalViewMode={taskListViewMode}
      />

      {/* Empty state (shown by TaskList, but we can add additional context) */}
      {counts.tasks === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Break down this work item into actionable tasks to track progress
                and assign work to team members.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        workspaceId={workItem.workspace_id}
        teamId={workItem.team_id}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleTaskCreated}
        // Pre-link to this work item
        workItemId={workItem.id}
      />
    </div>
  )
}
