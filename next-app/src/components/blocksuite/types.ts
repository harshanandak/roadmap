/**
 * BlockSuite TypeScript Types
 *
 * Re-exports and custom types for BlockSuite integration.
 * This file provides type-safe access to BlockSuite APIs
 * without requiring consumers to import from multiple packages.
 */

// Re-export core types from BlockSuite packages
export type { Doc, Schema } from '@blocksuite/store'

/**
 * Mind map tree node structure for BlockSuite
 * Used with MindmapUtils.createFromTree()
 */
export interface MindMapTreeNode {
  /** Display text for the node */
  text: string
  /** Child nodes */
  children?: MindMapTreeNode[]
  /** Custom data attached to the node */
  data?: Record<string, unknown>
}

/**
 * Mind map layout types supported by BlockSuite
 */
export type MindMapLayoutType = 'left' | 'right' | 'balance'

/**
 * Mind map style presets available in BlockSuite
 */
export type MindMapStyle = 'default' | 'style1' | 'style2' | 'style3' | 'style4'

/**
 * Editor mode types
 */
export type EditorMode = 'page' | 'edgeless'

/**
 * Block types available in BlockSuite
 * These are the common block types used in our application
 */
export type BlockType =
  | 'affine:page'
  | 'affine:surface'
  | 'affine:note'
  | 'affine:paragraph'
  | 'affine:list'
  | 'affine:code'
  | 'affine:divider'
  | 'affine:image'
  | 'affine:embed-linked-doc'

/**
 * Yjs snapshot format for persistence
 */
export interface YjsSnapshot {
  /** Base64 encoded Yjs update */
  data: string
  /** Document version for conflict resolution */
  version: number
  /** Timestamp of the snapshot */
  timestamp: number
}

/**
 * Document metadata for storage
 */
export interface DocumentMetadata {
  /** Document title */
  title?: string
  /** Document type (mindmap, document, etc.) */
  type: 'mindmap' | 'document' | 'canvas'
  /** Creation timestamp */
  createdAt: string
  /** Last modified timestamp */
  updatedAt: string
  /** Additional custom metadata */
  custom?: Record<string, unknown>
}

/**
 * BlockSuite document storage record
 * Matches the blocksuite_documents database table
 */
export interface BlockSuiteDocument {
  id: string
  team_id: string
  workspace_id: string | null
  yjs_snapshot: string
  document_type: 'mindmap' | 'document' | 'canvas'
  metadata: DocumentMetadata
  created_at: string
  updated_at: string
}

/**
 * Props for mind map specific editor
 */
export interface MindMapEditorProps {
  /** Initial tree structure to render */
  initialTree?: MindMapTreeNode
  /** Layout direction */
  layout?: MindMapLayoutType
  /** Visual style preset */
  style?: MindMapStyle
  /** Callback when tree changes */
  onTreeChange?: (tree: MindMapTreeNode) => void
  /** Callback when node is selected */
  onNodeSelect?: (nodeId: string, data: Record<string, unknown>) => void
  /** Whether the editor is read-only */
  readOnly?: boolean
}

/**
 * Node selection event data
 */
export interface NodeSelectionEvent {
  /** Selected node ID */
  nodeId: string
  /** Node type (shape, mindmap node, etc.) */
  nodeType: string
  /** Node data/properties */
  data: Record<string, unknown>
  /** Position in canvas */
  position?: { x: number; y: number }
}

/**
 * Canvas viewport state
 */
export interface CanvasViewport {
  /** Center X coordinate */
  centerX: number
  /** Center Y coordinate */
  centerY: number
  /** Zoom level (1 = 100%) */
  zoom: number
}
