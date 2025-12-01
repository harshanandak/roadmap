'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ArrowLeft, ChevronRight, PanelRightOpen, PanelRightClose } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PHASE_CONFIG, type WorkspacePhase } from '@/lib/constants/workspace-phases'
import { useWorkItemDetailContext } from './shared/detail-context'

interface WorkItemDetailHeaderProps {
  className?: string
}

export function WorkItemDetailHeader({ className }: WorkItemDetailHeaderProps) {
  const { workItem, phase, preferences, toggleSidebar } = useWorkItemDetailContext()

  const workspace = workItem.workspace
  const phaseConfig = PHASE_CONFIG[phase]
  const PhaseIcon = phaseConfig.icon

  return (
    <header className={cn('border-b bg-white', className)}>
      <div className="px-6 py-4">
        {/* Top row: Back button + Sidebar toggle */}
        <div className="flex items-center justify-between mb-3">
          {/* Breadcrumb navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href={`/workspaces/${workItem.workspace_id}?view=work-items`}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="text-sm">{workspace?.icon || '📦'} {workspace?.name || 'Workspace'}</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href={`/workspaces/${workItem.workspace_id}?view=work-items`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Work Items
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium truncate max-w-[200px]">
                  {workItem.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Sidebar toggle button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="flex items-center gap-2"
            title={preferences.sidebarCollapsed ? 'Show tracking sidebar' : 'Hide tracking sidebar'}
          >
            {preferences.sidebarCollapsed ? (
              <>
                <PanelRightOpen className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Show Details</span>
              </>
            ) : (
              <>
                <PanelRightClose className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Hide Details</span>
              </>
            )}
          </Button>
        </div>

        {/* Title row: Title + Phase badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight truncate">{workItem.title}</h1>

          {/* Phase badge */}
          <Badge
            variant="secondary"
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-0.5',
              phaseConfig.bgColor,
              'text-white border-0'
            )}
          >
            <PhaseIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{phaseConfig.name}</span>
          </Badge>
        </div>
      </div>
    </header>
  )
}

/**
 * Standalone version for testing without context
 */
interface WorkItemDetailHeaderStandaloneProps {
  title: string
  workspaceName: string
  workspaceIcon?: string
  workspaceId: string
  phase: WorkspacePhase
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  className?: string
}

export function WorkItemDetailHeaderStandalone({
  title,
  workspaceName,
  workspaceIcon,
  workspaceId,
  phase,
  sidebarCollapsed = false,
  onToggleSidebar,
  className,
}: WorkItemDetailHeaderStandaloneProps) {
  const phaseConfig = PHASE_CONFIG[phase]
  const PhaseIcon = phaseConfig.icon

  return (
    <header className={cn('border-b bg-white', className)}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href={`/workspaces/${workspaceId}?view=work-items`}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="text-sm">{workspaceIcon || '📦'} {workspaceName}</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium truncate max-w-[200px]">
                  {title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="flex items-center gap-2"
            >
              {sidebarCollapsed ? (
                <PanelRightOpen className="h-4 w-4" />
              ) : (
                <PanelRightClose className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
          <Badge
            variant="secondary"
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-0.5',
              phaseConfig.bgColor,
              'text-white border-0'
            )}
          >
            <PhaseIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{phaseConfig.name}</span>
          </Badge>
        </div>
      </div>
    </header>
  )
}
