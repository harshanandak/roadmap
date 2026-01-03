'use client'

import dynamic from 'next/dynamic'
import { LoadingSkeleton } from './loading-skeleton'
import type { BlockSuiteEditorProps } from './blocksuite-editor'

/**
 * SSR-Safe BlockSuite Editor Export
 *
 * BlockSuite uses browser APIs (Web Components, DOM, etc.) that aren't
 * available during server-side rendering. This wrapper uses Next.js
 * dynamic imports with ssr: false to ensure the editor only loads
 * on the client.
 *
 * @example
 * ```tsx
 * import { BlockSuiteEditor } from '@/components/blocksuite'
 *
 * function MyCanvas() {
 *   return (
 *     <BlockSuiteEditor
 *       mode="edgeless"
 *       onReady={(doc) => console.log('Editor ready')}
 *     />
 *   )
 * }
 * ```
 */
export const BlockSuiteEditor = dynamic<BlockSuiteEditorProps>(
  () => import('./blocksuite-editor').then((mod) => mod.BlockSuiteEditor),
  {
    ssr: false,
    // Default to edgeless mode for loading skeleton since we can't access props here
    // Use specific BlockSuitePageEditor or BlockSuiteCanvasEditor for mode-matched loading
    loading: () => <LoadingSkeleton mode="edgeless" />,
  }
)

/**
 * SSR-Safe Page Editor (Document mode)
 * Pre-configured for document editing with page mode
 */
export const BlockSuitePageEditor = dynamic<Omit<BlockSuiteEditorProps, 'mode'>>(
  () => import('./blocksuite-editor').then((mod) => {
    // Return a component that forces page mode
    const PageEditor = (props: Omit<BlockSuiteEditorProps, 'mode'>) => (
      <mod.BlockSuiteEditor {...props} mode="page" />
    )
    PageEditor.displayName = 'BlockSuitePageEditor'
    return { default: PageEditor }
  }),
  {
    ssr: false,
    loading: () => <LoadingSkeleton mode="page" />,
  }
)

/**
 * SSR-Safe Canvas Editor (Edgeless mode)
 * Pre-configured for canvas/whiteboard editing
 */
export const BlockSuiteCanvasEditor = dynamic<Omit<BlockSuiteEditorProps, 'mode'>>(
  () => import('./blocksuite-editor').then((mod) => {
    // Return a component that forces edgeless mode
    const CanvasEditor = (props: Omit<BlockSuiteEditorProps, 'mode'>) => (
      <mod.BlockSuiteEditor {...props} mode="edgeless" />
    )
    CanvasEditor.displayName = 'BlockSuiteCanvasEditor'
    return { default: CanvasEditor }
  }),
  {
    ssr: false,
    loading: () => <LoadingSkeleton mode="edgeless" />,
  }
)

// Re-export types
export type { BlockSuiteEditorProps } from './blocksuite-editor'
export { LoadingSkeleton } from './loading-skeleton'

// Re-export validation schemas
export {
  BlockSuiteEditorPropsSchema,
  MindMapTreeNodeSchema,
  MindMapLayoutTypeSchema,
  MindMapStyleSchema,
  MindMapEditorPropsSchema,
  DocumentMetadataSchema,
  BlockSuiteDocumentSchema,
  validateEditorProps,
  safeValidateEditorProps,
} from './schema'
export type { ValidatedBlockSuiteEditorProps } from './schema'

// Re-export BlockSuite types for convenience
export type {
  MindMapTreeNode,
  MindMapLayoutType,
  MindMapStyle,
  EditorMode,
  BlockType,
  YjsSnapshot,
  DocumentMetadata,
  BlockSuiteDocument,
  MindMapEditorProps,
  NodeSelectionEvent,
  CanvasViewport,
} from './types'
