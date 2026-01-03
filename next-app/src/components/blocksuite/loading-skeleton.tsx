'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  mode?: 'page' | 'edgeless'
}

/**
 * Loading skeleton for BlockSuite editor
 * Shows a placeholder while the editor is dynamically loading
 */
export function LoadingSkeleton({ className, mode = 'edgeless' }: LoadingSkeletonProps) {
  return (
    <div className={cn('flex flex-col w-full h-full min-h-[400px]', className)}>
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-2 p-2 border-b bg-background">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <div className="w-px h-6 bg-border mx-2" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-20 rounded" />
      </div>

      {/* Canvas/Editor skeleton */}
      <div className="flex-1 relative bg-muted/30">
        {mode === 'edgeless' ? (
          // Canvas mode - show node placeholders
          <div className="absolute inset-0 p-8">
            <div className="relative w-full h-full">
              {/* Central node */}
              <Skeleton className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 rounded-lg" />

              {/* Child nodes */}
              <Skeleton className="absolute top-1/4 left-1/4 w-24 h-12 rounded-lg" />
              <Skeleton className="absolute top-1/4 right-1/4 w-24 h-12 rounded-lg" />
              <Skeleton className="absolute bottom-1/4 left-1/3 w-24 h-12 rounded-lg" />
              <Skeleton className="absolute bottom-1/4 right-1/3 w-24 h-12 rounded-lg" />

              {/* Connection lines (simplified) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-48 border border-dashed border-muted-foreground/20 rounded-lg" />
            </div>
          </div>
        ) : (
          // Page mode - show document skeleton
          <div className="max-w-3xl mx-auto p-8 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <div className="h-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {/* Loading indicator */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Loading editor...</span>
        </div>
      </div>
    </div>
  )
}
