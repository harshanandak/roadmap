'use client'

import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Rocket, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkItemDetailContext } from '../shared/detail-context'
import { CreateTimelineItemDialog } from '@/components/work-items/create-timeline-item-dialog'
import { TimelineItemsList } from '@/components/work-items/timeline-items-list'

/**
 * Scope Tab - Timeline breakdown view (MVP/SHORT/LONG)
 *
 * Wraps the existing TimelineItemsList and CreateTimelineItemDialog
 * components with the new tabbed interface.
 */
export function ScopeTab() {
  const { workItem, timelineItems } = useWorkItemDetailContext()

  // Group timeline items by timeline type
  const groupedItems = useMemo(() => {
    return {
      MVP: timelineItems.filter((item) => item.timeline === 'MVP'),
      SHORT: timelineItems.filter((item) => item.timeline === 'SHORT'),
      LONG: timelineItems.filter((item) => item.timeline === 'LONG'),
    }
  }, [timelineItems])

  // Timeline config for display
  const timelineConfig = [
    {
      key: 'MVP' as const,
      title: 'MVP Timeline',
      description: 'Minimum Viable Product - Core items needed for launch',
      icon: Rocket,
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      key: 'SHORT' as const,
      title: 'Short Term Timeline',
      description: 'Items planned for the near future (1-3 months)',
      icon: Clock,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      key: 'LONG' as const,
      title: 'Long Term Timeline',
      description: 'Future enhancements and aspirational items',
      icon: Calendar,
      color: 'bg-teal-100 text-teal-700 border-teal-300',
      badgeColor: 'bg-teal-100 text-teal-700',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Scope & Timeline</h3>
            <p className="text-sm text-muted-foreground">
              Break down this work item into MVP, Short-term, and Long-term deliverables
            </p>
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-2">
          {timelineConfig.map((config) => (
            <Badge
              key={config.key}
              variant="outline"
              className={cn(config.badgeColor, 'text-xs')}
            >
              {config.key}: {groupedItems[config.key].length}
            </Badge>
          ))}
        </div>
      </div>

      {/* Timeline sections */}
      {timelineConfig.map((config) => {
        const items = groupedItems[config.key]
        const Icon = config.icon

        return (
          <Card key={config.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">{config.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {config.description}
                  </CardDescription>
                </div>
              </div>
              <CreateTimelineItemDialog
                workItemId={workItem.id}
                timeline={config.key}
                orderIndex={items.length}
              />
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <TimelineItemsList
                  items={items}
                  workItemId={workItem.id}
                  workspaceId={workItem.workspace_id}
                  teamId={workItem.team_id}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    No {config.key.toLowerCase()} items yet.{' '}
                    {config.key === 'MVP'
                      ? 'Add your first core item!'
                      : `Add ${config.key.toLowerCase()}-term items when ready.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Empty state when no items at all */}
      {timelineItems.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No timeline breakdown yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Break down this work item into MVP (core features), Short-term (1-3 months),
                and Long-term (future enhancements) deliverables.
              </p>
              <CreateTimelineItemDialog
                workItemId={workItem.id}
                timeline="MVP"
                orderIndex={0}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
