'use client'

import { useEffect, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  Search,
  FileText,
  Lightbulb,
  GitBranch,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Home,
  Sparkles,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface CommandPaletteProps {
  workspaceId?: string
}

export function CommandPalette({ workspaceId }: Readonly<CommandPaletteProps>) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams<{ id?: string }>()
  const routeWorkspaceId =
    pathname?.startsWith('/workspaces/') && typeof params.id === 'string'
      ? params.id
      : undefined
  const resolvedWorkspaceId = workspaceId || routeWorkspaceId

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((currentOpen) => !currentOpen)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigateTo = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation">
              <Command.Item
                onSelect={() =>
                  navigateTo(
                    resolvedWorkspaceId
                      ? `/workspaces/${resolvedWorkspaceId}?view=dashboard`
                      : '/dashboard'
                  )
                }
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <Home className="h-4 w-4" />
                <span>{resolvedWorkspaceId ? 'Go to Workspace Dashboard' : 'Go to Dashboard'}</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">G</span>H
                </kbd>
              </Command.Item>

              {resolvedWorkspaceId && (
                <>
                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${resolvedWorkspaceId}/ai`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Go to AI Assistant</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>F
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${resolvedWorkspaceId}/canvas`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>Go to Endless Canvas</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>M
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${resolvedWorkspaceId}/strategies`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <GitBranch className="h-4 w-4" />
                    <span>Go to Strategy</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>D
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${resolvedWorkspaceId}?view=timeline`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Go to Timeline</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>T
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${resolvedWorkspaceId}/review`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Go to Review Portal</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>R
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${resolvedWorkspaceId}?view=analytics`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Go to Analytics</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>A
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${resolvedWorkspaceId}/settings`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Workspace Settings</span>
                  </Command.Item>
                </>
              )}

              <Command.Item
                onSelect={() => navigateTo('/team/members')}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <Users className="h-4 w-4" />
                <span>Go to Team Members</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('/team/settings')}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <Settings className="h-4 w-4" />
                <span>Go to Organization Settings</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t p-2 text-xs text-muted-foreground">
            <span>Press <kbd className="rounded bg-muted px-1">Esc</kbd> to close</span>
            <span>Navigate with <kbd className="rounded bg-muted px-1">Up</kbd> <kbd className="rounded bg-muted px-1">Down</kbd></span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
