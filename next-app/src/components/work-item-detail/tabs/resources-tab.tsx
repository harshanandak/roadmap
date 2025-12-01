'use client'

/**
 * Resources Tab
 *
 * Displays technical resources linked to this work item including:
 * - documentation: Tutorials, guides, API docs, specs
 * - media: Videos, images, screenshots, mockups
 * - tool: Tools, utilities, services used for implementation
 *
 * Uses the resources system with tab_type = 'resource'.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Search,
  Link2,
  ExternalLink,
  Loader2,
  Inbox,
  FolderOpen,
  FileCode,
  Video,
  Image,
  Wrench,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useWorkItemDetailContext } from '../shared/detail-context'
import { ResourceCard } from '@/components/resources/resource-card'
import { AddResourceDialog } from '@/components/resources/add-resource-dialog'
import type { ResourceWithMeta, ResourceType } from '@/lib/types/resources'
import { cn } from '@/lib/utils'

// ============================================================================
// Types & Constants
// ============================================================================

type ResourceCategory = 'all' | 'documentation' | 'media' | 'tool'

const CATEGORY_CONFIG: Record<ResourceCategory, { label: string; icon: React.ElementType; description: string }> = {
  all: { label: 'All', icon: FolderOpen, description: 'All resources' },
  documentation: { label: 'Docs', icon: FileCode, description: 'API docs, guides, specs' },
  media: { label: 'Media', icon: Image, description: 'Screenshots, videos, mockups' },
  tool: { label: 'Tools', icon: Wrench, description: 'Services, utilities' },
}

// Animation variants
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium mb-2">Link Your Resources</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          Add API documentation, design files, GitHub repos, Figma links, and other
          resources needed for implementation.
        </p>
        <Button onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Loading State
// ============================================================================

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-32 w-full mb-3" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Stats Header
// ============================================================================

interface StatsHeaderProps {
  total: number
  documentationCount: number
  mediaCount: number
  toolCount: number
  searchQuery: string
  onSearchChange: (value: string) => void
}

function StatsHeader({
  total,
  documentationCount,
  mediaCount,
  toolCount,
  searchQuery,
  onSearchChange,
}: StatsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Resources</p>
        </div>
        <div className="h-8 border-l" />
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">{documentationCount}</p>
            <p className="text-xs text-muted-foreground">Docs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-orange-600">{mediaCount}</p>
            <p className="text-xs text-muted-foreground">Media</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-cyan-600">{toolCount}</p>
            <p className="text-xs text-muted-foreground">Tools</p>
          </div>
        </div>
      </div>

      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
    </div>
  )
}

// ============================================================================
// Main Resources Tab Component
// ============================================================================

export function ResourcesTab() {
  const { workItem } = useWorkItemDetailContext()
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [resources, setResources] = useState<ResourceWithMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState<ResourceCategory>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Fetch resources for this work item (resources tab)
  const fetchResources = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/work-items/${workItem.id}/resources`
      )
      if (!response.ok) throw new Error('Failed to fetch resources')

      const result = await response.json()
      // API returns { data: { inspiration: [], resources: [] } }
      const data = result.data || result
      // Get the resources array (tab_type = 'resource')
      const resourcesList = data.resources || []
      // Extract the actual resource objects from the links
      const extractedResources: ResourceWithMeta[] = resourcesList.map((link: { resource: ResourceWithMeta }) => link.resource)
      setResources(extractedResources)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
      toast({
        title: 'Error',
        description: 'Failed to load resources',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [workItem.id, toast])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  // Handle resource actions
  const handleDelete = useCallback(async (resource: ResourceWithMeta) => {
    try {
      const response = await fetch(
        `/api/work-items/${workItem.id}/resources?resource_id=${resource.id}`,
        { method: 'DELETE' }
      )
      if (!response.ok) throw new Error('Failed to unlink resource')

      toast({ title: 'Resource removed', description: 'Resource unlinked from this work item' })
      fetchResources()
    } catch {
      toast({ title: 'Error', description: 'Failed to remove resource', variant: 'destructive' })
    }
  }, [workItem.id, toast, fetchResources])

  const handleCopyLink = useCallback((resource: ResourceWithMeta) => {
    if (resource.url) {
      navigator.clipboard.writeText(resource.url)
      toast({ title: 'Link copied', description: 'URL copied to clipboard' })
    }
  }, [toast])

  const handleAddSuccess = useCallback(() => {
    setAddDialogOpen(false)
    fetchResources()
    router.refresh()
  }, [fetchResources, router])

  // Filter resources
  const filteredResources = resources.filter((r) => {
    const matchesSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = category === 'all' || r.resource_type === category
    return matchesSearch && matchesCategory
  })

  // Stats - for resource types (documentation, media, tool)
  const documentationCount = resources.filter((r) => r.resource_type === 'documentation').length
  const mediaCount = resources.filter((r) => r.resource_type === 'media').length
  const toolCount = resources.filter((r) => r.resource_type === 'tool').length

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <StatsHeader
        total={resources.length}
        documentationCount={documentationCount}
        mediaCount={mediaCount}
        toolCount={toolCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Category Tabs */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as ResourceCategory)}>
        <div className="flex items-center justify-between">
          <TabsList>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon
              return (
                <TabsTrigger key={key} value={key} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>

        {/* Content */}
        <TabsContent value={category} className="mt-6">
          {isLoading ? (
            <LoadingState />
          ) : filteredResources.length === 0 ? (
            <EmptyState onAddClick={() => setAddDialogOpen(true)} />
          ) : (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredResources.map((resource) => (
                <motion.div key={resource.id} variants={itemVariants}>
                  <ResourceCard
                    resource={resource}
                    onDelete={handleDelete}
                    onCopyLink={handleCopyLink}
                    showActions
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Resource Dialog */}
      <AddResourceDialog
        workItemId={workItem.id}
        workspaceId={workItem.workspace_id}
        teamId={workItem.team_id}
        tabType="resource"
        onResourceAdded={handleAddSuccess}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  )
}
