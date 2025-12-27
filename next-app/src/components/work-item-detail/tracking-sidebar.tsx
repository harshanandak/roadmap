'use client'

/**
 * Tracking Sidebar
 *
 * Fixed right sidebar showing work item tracking information:
 * - Status & Priority
 * - Assignments
 * - Dates (created, updated, target)
 * - Progress (timeline, tasks)
 * - Quick Actions
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Target,
  TrendingUp,
  Loader2,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useWorkItemDetailContext } from './shared/detail-context'
import { cn } from '@/lib/utils'

// ============================================================================
// Types & Constants
// ============================================================================

const STATUSES = [
  { value: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-amber-100 text-amber-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
] as const

const PRIORITIES = [
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' },
] as const

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ============================================================================
// Sidebar Section Components
// ============================================================================

interface SectionProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  )
}

// ============================================================================
// Status Section
// ============================================================================

function StatusSection() {
  const { workItem, phase, updateWorkItem } = useWorkItemDetailContext()
  const { toast } = useToast()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = useCallback(async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/work-items/${workItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      updateWorkItem({ status: newStatus })
      toast({ title: 'Status updated', description: `Work item marked as ${newStatus.replace('_', ' ')}` })
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }, [workItem.id, updateWorkItem, toast, router])

  const handlePriorityChange = useCallback(async (newPriority: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/work-items/${workItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (!response.ok) throw new Error('Failed to update priority')

      updateWorkItem({ priority: newPriority })
      toast({ title: 'Priority updated' })
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Failed to update priority', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }, [workItem.id, updateWorkItem, toast, router])

  const currentStatus = STATUSES.find((s) => s.value === workItem.status) || STATUSES[0]
  const currentPriority = PRIORITIES.find((p) => p.value === workItem.priority) || PRIORITIES[2]

  return (
    <Section title="Status" icon={Target}>
      <div className="space-y-3">
        {/* Status Dropdown */}
        <div>
          <Select
            value={workItem.status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className={cn('h-8', currentStatus.color)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', status.color.split(' ')[0])} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Dropdown */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
          <Select
            value={workItem.priority}
            onValueChange={handlePriorityChange}
            disabled={isUpdating}
          >
            <SelectTrigger className={cn('h-8 border', currentPriority.color)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phase Badge */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Phase</label>
          <Badge variant="outline" className="capitalize">
            {phase}
          </Badge>
        </div>
      </div>
    </Section>
  )
}

// ============================================================================
// Assignment Section
// ============================================================================

function AssignmentSection() {
  const { workItem } = useWorkItemDetailContext()

  const assignee = workItem.assigned_to_user

  return (
    <Section title="Assignment" icon={User}>
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={undefined} />
          <AvatarFallback className="text-xs bg-primary/10">
            {assignee ? getInitials(assignee.name || assignee.email) : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {assignee?.name || assignee?.email || 'Unassigned'}
          </p>
          {assignee?.email && assignee.name && (
            <p className="text-xs text-muted-foreground truncate">{assignee.email}</p>
          )}
        </div>
      </div>
    </Section>
  )
}

// ============================================================================
// Dates Section
// ============================================================================

function DatesSection() {
  const { workItem } = useWorkItemDetailContext()

  return (
    <Section title="Dates" icon={Calendar}>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Created</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium">{formatRelativeTime(workItem.created_at)}</span>
              </TooltipTrigger>
              <TooltipContent>
                {formatDate(workItem.created_at)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Updated</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium">{formatRelativeTime(workItem.updated_at)}</span>
              </TooltipTrigger>
              <TooltipContent>
                {formatDate(workItem.updated_at)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Section>
  )
}

// ============================================================================
// Progress Section
// ============================================================================

function ProgressSection() {
  const { counts, timelineItems } = useWorkItemDetailContext()

  // Calculate timeline progress
  const completedTimelines = timelineItems.filter((t) => t.status === 'completed').length
  const timelineProgress = counts.timelineItems > 0
    ? Math.round((completedTimelines / counts.timelineItems) * 100)
    : 0

  return (
    <Section title="Progress" icon={TrendingUp}>
      <div className="space-y-4">
        {/* Timeline Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Timeline Items</span>
            <span className="font-medium">{completedTimelines}/{counts.timelineItems}</span>
          </div>
          <Progress value={timelineProgress} className="h-1.5" />
        </div>

        {/* Tasks Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Tasks</span>
            <span className="font-medium">{counts.tasks} total</span>
          </div>
          <div className="flex gap-1">
            {counts.tasks > 0 ? (
              <div className="flex gap-0.5 flex-1">
                <div className="h-1.5 bg-green-500 rounded-l flex-1" style={{ flex: 1 }} />
                <div className="h-1.5 bg-blue-500 flex-1" style={{ flex: 1 }} />
                <div className="h-1.5 bg-slate-200 rounded-r flex-1" style={{ flex: 1 }} />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No tasks yet</div>
            )}
          </div>
        </div>

        {/* Timeline Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-purple-50 rounded-lg p-2">
            <div className="text-lg font-bold text-purple-700">{counts.mvpItems}</div>
            <div className="text-[10px] text-purple-600 font-medium">MVP</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="text-lg font-bold text-blue-700">{counts.shortItems}</div>
            <div className="text-[10px] text-blue-600 font-medium">SHORT</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2">
            <div className="text-lg font-bold text-emerald-700">{counts.longItems}</div>
            <div className="text-[10px] text-emerald-600 font-medium">LONG</div>
          </div>
        </div>
      </div>
    </Section>
  )
}

// ============================================================================
// Quick Actions Section
// ============================================================================

function QuickActionsSection() {
  const { workItem, updateWorkItem } = useWorkItemDetailContext()
  const { toast } = useToast()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleMarkComplete = useCallback(async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/work-items/${workItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })

      if (!response.ok) throw new Error('Failed to update')

      updateWorkItem({ status: 'completed' })
      toast({ title: 'Work item completed!', description: 'Great job finishing this work item.' })
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Failed to mark as complete', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }, [workItem.id, updateWorkItem, toast, router])

  const isCompleted = workItem.status === 'completed'

  return (
    <div className="space-y-2">
      <Button
        variant={isCompleted ? 'secondary' : 'default'}
        size="sm"
        className="w-full"
        disabled={isCompleted || isUpdating}
        onClick={handleMarkComplete}
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCheck className="h-4 w-4 mr-2" />
        )}
        {isCompleted ? 'Completed' : 'Mark Complete'}
      </Button>
    </div>
  )
}

// ============================================================================
// Main Tracking Sidebar Component
// ============================================================================

export function TrackingSidebar() {
  const { preferences, toggleSidebar } = useWorkItemDetailContext()

  return (
    <AnimatePresence mode="wait">
      {!preferences.sidebarCollapsed && (
        <motion.aside
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 h-screen w-80 border-l bg-white/95 backdrop-blur-sm shadow-lg hidden lg:flex flex-col pt-[72px] z-40"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Tracking</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleSidebar}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <StatusSection />
            <Separator />
            <AssignmentSection />
            <Separator />
            <DatesSection />
            <Separator />
            <ProgressSection />
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t bg-slate-50/50">
            <QuickActionsSection />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Collapsed Sidebar Toggle
// ============================================================================

export function CollapsedSidebarToggle() {
  const { preferences, toggleSidebar } = useWorkItemDetailContext()

  if (!preferences.sidebarCollapsed) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed right-4 top-20 z-40 hidden lg:block"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full shadow-lg bg-white"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Show Tracking Sidebar
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  )
}
