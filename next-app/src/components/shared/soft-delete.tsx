'use client'

/**
 * Reusable Soft Delete Components
 *
 * Pattern for 30-day recycle bin across the app:
 * - DaysRemaining: Shows countdown to permanent deletion
 * - RestoreButton: Restore item from trash
 * - DeleteForeverButton: Permanently delete with confirmation
 * - TrashBadge: Visual indicator for deleted items
 */

import { useState } from 'react'
import { Trash2, RotateCcw, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { calculateDaysRemaining } from '@/lib/types/resources'

// ============================================================================
// DAYS REMAINING COMPONENT
// ============================================================================

interface DaysRemainingProps {
  deletedAt: string | null
  retentionDays?: number
  className?: string
  showIcon?: boolean
}

export function DaysRemaining({
  deletedAt,
  retentionDays = 30,
  className,
  showIcon = true,
}: DaysRemainingProps) {
  const daysLeft = calculateDaysRemaining(deletedAt, retentionDays)

  const getColor = () => {
    if (daysLeft <= 3) return 'text-red-500'
    if (daysLeft <= 7) return 'text-orange-500'
    if (daysLeft <= 14) return 'text-yellow-500'
    return 'text-muted-foreground'
  }

  return (
    <div className={cn('flex items-center gap-1 text-sm', getColor(), className)}>
      {showIcon && <Clock className="h-3.5 w-3.5" />}
      <span>
        {daysLeft === 0
          ? 'Deleting today'
          : daysLeft === 1
            ? '1 day left'
            : `${daysLeft} days left`}
      </span>
    </div>
  )
}

// ============================================================================
// RESTORE BUTTON COMPONENT
// ============================================================================

interface RestoreButtonProps {
  onRestore: () => Promise<void>
  isLoading?: boolean
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function RestoreButton({
  onRestore,
  isLoading = false,
  variant = 'outline',
  size = 'sm',
  className,
  showLabel = true,
}: RestoreButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleRestore = async () => {
    setIsPending(true)
    try {
      await onRestore()
    } finally {
      setIsPending(false)
    }
  }

  const loading = isLoading || isPending

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRestore}
      disabled={loading}
      className={cn('gap-1.5', className)}
    >
      <RotateCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
      {showLabel && (loading ? 'Restoring...' : 'Restore')}
    </Button>
  )
}

// ============================================================================
// DELETE FOREVER BUTTON COMPONENT
// ============================================================================

interface DeleteForeverButtonProps {
  itemName: string
  onDelete: () => Promise<void>
  isLoading?: boolean
  variant?: 'default' | 'destructive' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function DeleteForeverButton({
  itemName,
  onDelete,
  isLoading = false,
  variant = 'destructive',
  size = 'sm',
  className,
  showLabel = true,
}: DeleteForeverButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    setIsPending(true)
    try {
      await onDelete()
      setIsOpen(false)
    } finally {
      setIsPending(false)
    }
  }

  const loading = isLoading || isPending

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={loading}
          className={cn('gap-1.5', className)}
        >
          <Trash2 className="h-4 w-4" />
          {showLabel && 'Delete Forever'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Permanently Delete?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>&ldquo;{itemName}&rdquo;</strong>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete Forever'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ============================================================================
// TRASH BADGE COMPONENT
// ============================================================================

interface TrashBadgeProps {
  deletedAt: string | null
  className?: string
}

export function TrashBadge({ deletedAt, className }: TrashBadgeProps) {
  const daysLeft = calculateDaysRemaining(deletedAt, 30)

  const getVariant = () => {
    if (daysLeft <= 3) return 'destructive'
    if (daysLeft <= 7) return 'default'
    return 'secondary'
  }

  return (
    <Badge variant={getVariant()} className={cn('gap-1', className)}>
      <Trash2 className="h-3 w-3" />
      In Trash
    </Badge>
  )
}

// ============================================================================
// EMPTY TRASH VIEW COMPONENT
// ============================================================================

interface EmptyTrashProps {
  entityName?: string
}

export function EmptyTrash({ entityName = 'items' }: EmptyTrashProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Trash2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">Trash is empty</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Deleted {entityName} will appear here for 30 days before being permanently removed.
      </p>
    </div>
  )
}

// ============================================================================
// TRASH INFO BANNER
// ============================================================================

interface TrashInfoBannerProps {
  itemCount: number
  entityName?: string
  className?: string
}

export function TrashInfoBanner({
  itemCount,
  entityName = 'items',
  className,
}: TrashInfoBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 p-4',
        className
      )}
    >
      <Trash2 className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
      <div className="text-sm">
        <p className="font-medium text-yellow-800 dark:text-yellow-200">
          {itemCount} {itemCount === 1 ? entityName.slice(0, -1) : entityName} in trash
        </p>
        <p className="text-yellow-700 dark:text-yellow-400">
          Items are permanently deleted 30 days after being moved to trash.
        </p>
      </div>
    </div>
  )
}
