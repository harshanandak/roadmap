'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkItemDetailContext, type DetailTab } from './shared/detail-context'

interface WorkItemDetailTabsProps {
  className?: string
}

export function WorkItemDetailTabs({ className }: WorkItemDetailTabsProps) {
  const { activeTab, setActiveTab, visibleTabs, counts } = useWorkItemDetailContext()

  // Get count for a specific tab (for badges)
  const getTabCount = (tabId: DetailTab): number | undefined => {
    switch (tabId) {
      case 'scope':
        return counts.timelineItems > 0 ? counts.timelineItems : undefined
      case 'tasks':
        return counts.tasks > 0 ? counts.tasks : undefined
      case 'feedback':
        return counts.feedback > 0 ? counts.feedback : undefined
      default:
        return undefined
    }
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as DetailTab)}
      className={className}
    >
      <TabsList className="h-11 p-1 bg-muted flex-wrap justify-start">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const count = getTabCount(tab.id)

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'flex items-center gap-2 px-3 h-9',
                'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                'transition-all duration-200',
                // Slightly smaller text for better fit with 8 tabs
                'text-sm'
              )}
              title={tab.description}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium hidden sm:inline">{tab.label}</span>

              {/* Count badge */}
              {count !== undefined && (
                <span className="ml-0.5 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full tabular-nums">
                  {count}
                </span>
              )}

              {/* Pro badge */}
              {tab.isPro && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 px-1 py-0 h-4 text-[10px] bg-amber-100 text-amber-700 border-amber-200"
                >
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  Pro
                </Badge>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}

/**
 * Standalone version for testing without context
 */
interface WorkItemDetailTabsStandaloneProps {
  value: DetailTab
  onChange: (value: DetailTab) => void
  visibleTabs: Array<{
    id: DetailTab
    label: string
    icon: React.ComponentType<{ className?: string }>
    isPro?: boolean
  }>
  counts?: {
    scope?: number
    tasks?: number
    feedback?: number
  }
  className?: string
}

export function WorkItemDetailTabsStandalone({
  value,
  onChange,
  visibleTabs,
  counts = {},
  className,
}: WorkItemDetailTabsStandaloneProps) {
  const getTabCount = (tabId: DetailTab): number | undefined => {
    switch (tabId) {
      case 'scope':
        return counts.scope
      case 'tasks':
        return counts.tasks
      case 'feedback':
        return counts.feedback
      default:
        return undefined
    }
  }

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as DetailTab)}
      className={className}
    >
      <TabsList className="h-11 p-1 bg-muted flex-wrap justify-start">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const count = getTabCount(tab.id)

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'flex items-center gap-2 px-3 h-9',
                'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                'transition-all duration-200',
                'text-sm'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium hidden sm:inline">{tab.label}</span>

              {count !== undefined && count > 0 && (
                <span className="ml-0.5 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full tabular-nums">
                  {count}
                </span>
              )}

              {tab.isPro && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 px-1 py-0 h-4 text-[10px] bg-amber-100 text-amber-700 border-amber-200"
                >
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  Pro
                </Badge>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
