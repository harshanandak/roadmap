'use client'

/**
 * Concept Promotion Dialog
 *
 * Allows promoting a validated concept to a feature work item.
 * Creates a new feature with `enhances_work_item_id` linking to the concept.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Rocket } from 'lucide-react'

export interface ConceptForPromotion {
  id: string
  name: string
  description: string | null
  workspace_id: string
  team_id: string
}

export interface ConceptPromotionDialogProps {
  concept: ConceptForPromotion
  open: boolean
  onOpenChange: (open: boolean) => void
  onPromote: (featureId: string) => void
}

export function ConceptPromotionDialog({
  concept,
  open,
  onOpenChange,
  onPromote,
}: ConceptPromotionDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [featureName, setFeatureName] = useState(concept.name)
  const [featureDescription, setFeatureDescription] = useState(
    concept.description || ''
  )

  const handlePromote = async () => {
    if (!featureName.trim()) {
      toast({
        title: 'Error',
        description: 'Feature name is required',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: featureName.trim(),
          description: featureDescription.trim() || null,
          type: 'feature',
          phase: 'design', // Start in design phase
          priority: 'medium',
          workspace_id: concept.workspace_id,
          team_id: concept.team_id,
          enhances_work_item_id: concept.id, // Link to concept
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create feature')
      }

      const { data: newFeature } = await response.json()

      toast({
        title: 'Concept Promoted!',
        description: `Feature "${featureName}" created successfully`,
      })

      // Close dialog and notify parent
      onOpenChange(false)
      router.refresh()
      onPromote(newFeature.id)
    } catch (error) {
      console.error('Failed to promote concept:', error)
      toast({
        title: 'Promotion Failed',
        description: 'Could not create feature. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-green-600" />
            Promote to Feature
          </DialogTitle>
          <DialogDescription>
            Create a new feature work item from this validated concept.
            The new feature will link to this concept for traceability.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Feature Name */}
          <div className="space-y-2">
            <Label htmlFor="feature-name">
              Feature Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="feature-name"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              placeholder="Enter feature name..."
              disabled={loading}
            />
          </div>

          {/* Feature Description */}
          <div className="space-y-2">
            <Label htmlFor="feature-description">Description</Label>
            <Textarea
              id="feature-description"
              value={featureDescription}
              onChange={(e) => setFeatureDescription(e.target.value)}
              placeholder="Describe what this feature will do..."
              rows={4}
              disabled={loading}
              className="resize-none"
            />
          </div>

          {/* Info Message */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium">What happens next:</p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-xs">
              <li>New feature created in Design phase</li>
              <li>Linked to this concept for traceability</li>
              <li>You'll be redirected to the new feature</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Feature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
