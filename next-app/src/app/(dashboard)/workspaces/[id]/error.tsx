'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Workspace route failed:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-8 py-12">
      <div className="max-w-md space-y-4 rounded-2xl border bg-background p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Workspace failed to load</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while loading this workspace. Retry the request, then check the
            workspace data if it keeps failing.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.assign('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
