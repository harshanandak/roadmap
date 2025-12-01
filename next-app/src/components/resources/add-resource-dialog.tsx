'use client'

/**
 * Add Resource Dialog
 *
 * Dialog for adding a new resource or linking an existing one to a work item.
 * Supports:
 * - Creating new resources with URL, title, description
 * - Searching and linking existing resources
 * - Auto-fetching metadata from URLs
 */

import { useState, useEffect } from 'react'
import { Plus, Search, Link2, ExternalLink, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type {
  ResourceType,
  TabType,
  ResourceWithMeta,
  CreateResourceRequest,
} from '@/lib/types/resources'
import {
  RESOURCE_TYPES,
  getResourceTypeLabel,
  extractDomain,
} from '@/lib/types/resources'
import { ResourceItem } from './resource-card'

interface AddResourceDialogProps {
  workItemId: string
  workspaceId: string
  teamId: string
  tabType?: TabType
  onResourceAdded: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddResourceDialog({
  workItemId,
  workspaceId,
  teamId,
  tabType = 'resource',
  onResourceAdded,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddResourceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New resource form state
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [resourceType, setResourceType] = useState<ResourceType>('reference')
  const [contextNote, setContextNote] = useState('')

  // Existing resource search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ResourceWithMeta[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedResource, setSelectedResource] = useState<ResourceWithMeta | null>(null)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTitle('')
      setUrl('')
      setDescription('')
      setNotes('')
      setResourceType('reference')
      setContextNote('')
      setSearchQuery('')
      setSearchResults([])
      setSelectedResource(null)
      setError(null)
      setActiveTab('new')
    }
  }, [open])

  // Search existing resources
  useEffect(() => {
    if (activeTab !== 'existing' || !searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const searchResources = async () => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams({
          team_id: teamId,
          workspace_id: workspaceId,
          q: searchQuery,
          limit: '10',
        })
        const response = await fetch(`/api/resources/search?${params}`)
        if (response.ok) {
          const { data } = await response.json()
          setSearchResults(data || [])
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchResources, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, activeTab, teamId, workspaceId])

  // Auto-fill title from URL
  useEffect(() => {
    if (url && !title) {
      const domain = extractDomain(url)
      if (domain) {
        setTitle(domain)
      }
    }
  }, [url, title])

  const handleSubmitNew = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload: CreateResourceRequest = {
        workspace_id: workspaceId,
        team_id: teamId,
        title: title.trim(),
        url: url.trim() || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        resource_type: resourceType,
        work_item_id: workItemId,
        tab_type: tabType,
        context_note: contextNote.trim() || undefined,
      }

      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Failed to create resource')
      }

      onResourceAdded()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLinkExisting = async () => {
    if (!selectedResource) {
      setError('Please select a resource')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/work-items/${workItemId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: selectedResource.id,
          tab_type: tabType,
          context_note: contextNote.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Failed to link resource')
      }

      onResourceAdded()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link resource')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Resource
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Add a new resource or link an existing one to this work item.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'existing')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Resource
            </TabsTrigger>
            <TabsTrigger value="existing" className="gap-1.5">
              <Link2 className="h-4 w-4" />
              Link Existing
            </TabsTrigger>
          </TabsList>

          {/* New Resource Tab */}
          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL (optional)</Label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Resource title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={resourceType} onValueChange={(v) => setResourceType(v as ResourceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getResourceTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this resource"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Your notes about this resource"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </TabsContent>

          {/* Link Existing Tab */}
          <TabsContent value="existing" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Resources</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, URL, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="min-h-[200px] max-h-[300px] overflow-auto rounded-lg border">
              {isSearching ? (
                <div className="flex items-center justify-center h-full py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y">
                  {searchResults.map((resource) => (
                    <div
                      key={resource.id}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedResource?.id === resource.id && 'bg-accent'
                      )}
                      onClick={() => setSelectedResource(resource)}
                    >
                      <ResourceItem resource={resource} />
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">No resources found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different search term or create a new resource
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Search for existing resources
                  </p>
                </div>
              )}
            </div>

            {selectedResource && (
              <div className="space-y-2">
                <Label htmlFor="context">Context Note (optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Why is this resource relevant to this work item?"
                  value={contextNote}
                  onChange={(e) => setContextNote(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={activeTab === 'new' ? handleSubmitNew : handleLinkExisting}
            disabled={isSubmitting || (activeTab === 'existing' && !selectedResource)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {activeTab === 'new' ? 'Creating...' : 'Linking...'}
              </>
            ) : activeTab === 'new' ? (
              'Create Resource'
            ) : (
              'Link Resource'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
