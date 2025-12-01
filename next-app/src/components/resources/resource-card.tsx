'use client'

/**
 * Resource Card Component
 *
 * Displays a single resource with:
 * - Title, URL, and type badge
 * - Thumbnail/favicon preview
 * - Link count indicator
 * - Actions (edit, delete, etc.)
 */

import { useState } from 'react'
import {
  ExternalLink,
  Link2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Copy,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ResourceWithMeta, ResourceType } from '@/lib/types/resources'
import { getResourceTypeLabel } from '@/lib/types/resources'
import { TrashBadge, DaysRemaining } from '@/components/shared/soft-delete'

// Resource type colors
const typeColors: Record<ResourceType, string> = {
  reference: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  inspiration: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  documentation: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  media: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  tool: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

interface ResourceCardProps {
  resource: ResourceWithMeta
  onEdit?: (resource: ResourceWithMeta) => void
  onDelete?: (resource: ResourceWithMeta) => void
  onView?: (resource: ResourceWithMeta) => void
  onCopyLink?: (resource: ResourceWithMeta) => void
  showLinkCount?: boolean
  showActions?: boolean
  isCompact?: boolean
  className?: string
}

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onView,
  onCopyLink,
  showLinkCount = true,
  showActions = true,
  isCompact = false,
  className,
}: ResourceCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleOpenUrl = () => {
    if (resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopy = () => {
    if (resource.url) {
      navigator.clipboard.writeText(resource.url)
      onCopyLink?.(resource)
    }
  }

  const displayImage = !imageError && (resource.image_url || resource.favicon_url)

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-md',
        resource.is_deleted && 'opacity-75',
        className
      )}
    >
      <CardContent className={cn('p-4', isCompact && 'p-3')}>
        <div className="flex gap-3">
          {/* Thumbnail / Favicon */}
          <div
            className={cn(
              'shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden',
              isCompact ? 'h-10 w-10' : 'h-14 w-14'
            )}
          >
            {displayImage ? (
              <img
                src={resource.image_url || resource.favicon_url || ''}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-lg font-bold text-muted-foreground uppercase">
                {resource.title.charAt(0)}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {/* Title */}
                <h4
                  className={cn(
                    'font-medium truncate',
                    isCompact ? 'text-sm' : 'text-base'
                  )}
                >
                  {resource.title}
                </h4>

                {/* URL / Domain */}
                {resource.url && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {resource.source_domain || resource.url}
                  </p>
                )}
              </div>

              {/* Actions */}
              {showActions && !resource.is_deleted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {resource.url && (
                      <>
                        <DropdownMenuItem onClick={handleOpenUrl}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCopy}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(resource)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(resource)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(resource)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Move to Trash
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Description (non-compact only) */}
            {!isCompact && resource.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {resource.description}
              </p>
            )}

            {/* Footer: Type badge + link count */}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="secondary"
                className={cn('text-xs', typeColors[resource.resource_type])}
              >
                {getResourceTypeLabel(resource.resource_type)}
              </Badge>

              {resource.is_deleted && (
                <TrashBadge deletedAt={resource.deleted_at} />
              )}

              {showLinkCount && resource.linked_work_items_count !== undefined && resource.linked_work_items_count > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        <span>{resource.linked_work_items_count}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Linked to {resource.linked_work_items_count} work item
                      {resource.linked_work_items_count !== 1 && 's'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Days remaining (for deleted items) */}
            {resource.is_deleted && resource.deleted_at && (
              <DaysRemaining deletedAt={resource.deleted_at} className="mt-2" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPACT RESOURCE ITEM (for lists)
// ============================================================================

interface ResourceItemProps {
  resource: ResourceWithMeta
  onRemove?: () => void
  onEdit?: () => void
  showRemove?: boolean
  className?: string
}

export function ResourceItem({
  resource,
  onRemove,
  onEdit,
  showRemove = false,
  className,
}: ResourceItemProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group',
        className
      )}
    >
      {/* Favicon */}
      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {!imageError && resource.favicon_url ? (
          <img
            src={resource.favicon_url}
            alt=""
            className="h-5 w-5"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-xs font-bold text-muted-foreground uppercase">
            {resource.title.charAt(0)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{resource.title}</p>
        {resource.source_domain && (
          <p className="text-xs text-muted-foreground truncate">
            {resource.source_domain}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {resource.url && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => window.open(resource.url!, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
