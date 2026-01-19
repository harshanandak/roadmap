'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MindMapCanvasWithToolbar } from '@/components/blocksuite/mind-map-canvas-with-toolbar'
import type { BlockSuiteMindmapNode } from '@/components/blocksuite/mindmap-types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'

/**
 * BlockSuite Mind Map Test Page
 *
 * This page is for testing BlockSuite's native mindmap functionality
 * before replacing the ReactFlow implementation.
 *
 * Access: /workspaces/[id]/mind-maps/[mindMapId]/blocksuite
 */
export default function BlockSuiteTestPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string
  const mindMapId = params.mindMapId as string

  const [currentTree, setCurrentTree] = useState<BlockSuiteMindmapNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<{ id: string; text: string } | null>(null)

  // Sample tree for testing - you can modify this
  const sampleTree: BlockSuiteMindmapNode = {
    text: 'Product Roadmap',
    children: [
      {
        text: 'Research Phase',
        children: [
          { text: 'User Interviews' },
          { text: 'Market Analysis' },
          { text: 'Competitor Review' },
        ],
      },
      {
        text: 'Planning Phase',
        children: [
          { text: 'Feature Prioritization' },
          { text: 'Timeline Estimation' },
          { text: 'Resource Allocation' },
        ],
      },
      {
        text: 'Execution Phase',
        children: [
          { text: 'Sprint 1' },
          { text: 'Sprint 2' },
          { text: 'Sprint 3' },
        ],
      },
      {
        text: 'Review Phase',
        children: [
          { text: 'QA Testing' },
          { text: 'User Feedback' },
          { text: 'Performance Metrics' },
        ],
      },
    ],
  }

  const handleTreeChange = useCallback((tree: BlockSuiteMindmapNode) => {
    setCurrentTree(tree)
    console.log('Tree changed:', tree)
  }, [])

  const handleNodeSelect = useCallback((nodeId: string, nodeText: string) => {
    setSelectedNode({ id: nodeId, text: nodeText })
    console.log('Node selected:', nodeId, nodeText)
  }, [])

  const handleSaveTree = useCallback(() => {
    if (currentTree) {
      console.log('Saving tree:', currentTree)
      // TODO: Implement save to database
      alert('Tree data logged to console. Database save not yet implemented.')
    }
  }, [currentTree])

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/workspaces/${workspaceId}/mind-maps/${mindMapId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to ReactFlow
          </Button>
          <div>
            <h1 className="text-xl font-bold">BlockSuite Test Page</h1>
            <p className="text-sm text-slate-500">
              Mind Map ID: {mindMapId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedNode && (
            <span className="text-sm text-slate-600 mr-4">
              Selected: <strong>{selectedNode.text}</strong>
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleSaveTree}>
            <Save className="mr-2 h-4 w-4" />
            Log Tree to Console
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <p className="text-sm text-blue-800">
          <strong>Testing BlockSuite:</strong> This page uses BlockSuite&apos;s native mindmap renderer.
          Try: Click nodes to select, use toolbar to add nodes, change layout/style.
        </p>
      </div>

      {/* BlockSuite Canvas */}
      <div className="flex-1">
        <MindMapCanvasWithToolbar
          documentId={`blocksuite-test-${mindMapId}`}
          initialTree={sampleTree}
          style={4}
          layout={2}
          onTreeChange={handleTreeChange}
          onNodeSelect={handleNodeSelect}
          className="h-full"
        />
      </div>
    </div>
  )
}
