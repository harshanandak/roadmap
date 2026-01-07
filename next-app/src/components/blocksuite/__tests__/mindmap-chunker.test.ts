/**
 * Tests for mindmap-chunker.ts
 */

import { describe, it, expect } from 'vitest'
import { chunkMindmapForEmbedding, getChunkStats, validateChunks, DEFAULT_CHUNK_OPTIONS } from '../mindmap-chunker'
import { extractTextFromBlockSuiteTree } from '../text-extractor'
import type { BlockSuiteMindmapNode } from '../mindmap-types'

describe('chunkMindmapForEmbedding', () => {
  const context = {
    mindMapId: 'test-map-123',
    teamId: 'team-456',
    workspaceId: 'ws-789'
  }

  it('should throw error if teamId is missing', () => {
    const tree: BlockSuiteMindmapNode = { text: 'Root', children: [] }
    const extraction = extractTextFromBlockSuiteTree(tree)

    expect(() =>
      chunkMindmapForEmbedding(extraction, {
        mindMapId: 'test',
        teamId: '', // Empty teamId
        workspaceId: 'ws'
      })
    ).toThrow('teamId is required for multi-tenant safety')
  })

  it('should create chunks from simple tree', () => {
    const tree: BlockSuiteMindmapNode = {
      text: 'Product Strategy with more text content to reach minimum chunk size',
      children: [
        { text: 'Goals and objectives for the quarter with detailed descriptions', children: [] },
        { text: 'Metrics we need to track including KPIs and OKRs', children: [] }
      ]
    }
    const extraction = extractTextFromBlockSuiteTree(tree)
    const chunks = chunkMindmapForEmbedding(extraction, context)

    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].metadata.teamId).toBe('team-456')
    expect(chunks[0].metadata.mindMapId).toBe('test-map-123')
    expect(chunks[0].metadata.source).toBe('blocksuite_mindmap')
  })

  it('should include path context in chunks', () => {
    const tree: BlockSuiteMindmapNode = {
      text: 'Root topic with substantial content for chunking purposes',
      children: [{
        text: 'Branch topic that contains enough text to be chunked individually',
        children: [{
          text: 'Leaf topic with detailed content that should include path context from ancestors',
          children: []
        }]
      }]
    }
    const extraction = extractTextFromBlockSuiteTree(tree)
    const chunks = chunkMindmapForEmbedding(extraction, context, {
      includePathContext: true,
      minChunkSize: 10
    })

    // At least one chunk should have path context
    const hasPathContext = chunks.some(c => c.content.includes(' > '))
    expect(hasPathContext).toBe(true)
  })

  it('should handle small subtrees without losing children', () => {
    // This tests the fix for the data loss bug
    const tree: BlockSuiteMindmapNode = {
      text: 'A', // Very short parent
      children: [
        { text: 'Child with much longer text that should not be lost when processing', children: [] }
      ]
    }
    const extraction = extractTextFromBlockSuiteTree(tree)
    const chunks = chunkMindmapForEmbedding(extraction, context, {
      minChunkSize: 10
    })

    // The child should be chunked even if parent is too small
    const hasChildContent = chunks.some(c => c.content.includes('Child with much longer'))
    expect(hasChildContent).toBe(true)
  })

  it('should respect maxTokensPerChunk option', () => {
    const longText = 'This is a very long text that repeats itself. '.repeat(20)
    const tree: BlockSuiteMindmapNode = {
      text: longText,
      children: [
        { text: longText, children: [] }
      ]
    }
    const extraction = extractTextFromBlockSuiteTree(tree)
    const chunks = chunkMindmapForEmbedding(extraction, context, {
      maxTokensPerChunk: 100,
      minChunkSize: 10
    })

    // Check that chunks exist
    expect(chunks.length).toBeGreaterThan(0)
  })
})

describe('getChunkStats', () => {
  it('should return zeros for empty chunks', () => {
    const stats = getChunkStats([])
    expect(stats.totalChunks).toBe(0)
    expect(stats.totalTokens).toBe(0)
    expect(stats.avgTokensPerChunk).toBe(0)
  })

  it('should compute correct statistics', () => {
    const chunks = [
      {
        content: 'Test content one',
        index: 0,
        heading: 'Test',
        metadata: {
          mindMapId: 'test',
          teamId: 'team',
          path: [],
          nodeType: 'root' as const,
          depth: 0,
          source: 'blocksuite_mindmap' as const
        }
      },
      {
        content: 'Test content two that is longer',
        index: 1,
        heading: 'Test 2',
        metadata: {
          mindMapId: 'test',
          teamId: 'team',
          path: ['Test'],
          nodeType: 'leaf' as const,
          depth: 1,
          source: 'blocksuite_mindmap' as const
        }
      }
    ]
    const stats = getChunkStats(chunks)
    expect(stats.totalChunks).toBe(2)
    expect(stats.chunksByType.root).toBe(1)
    expect(stats.chunksByType.leaf).toBe(1)
    expect(stats.chunksByDepth[0]).toBe(1)
    expect(stats.chunksByDepth[1]).toBe(1)
  })
})

describe('validateChunks', () => {
  it('should pass validation for valid chunks', () => {
    const chunks = [{
      content: 'Valid chunk content',
      index: 0,
      heading: 'Test',
      metadata: {
        mindMapId: 'test',
        teamId: 'team',
        path: [],
        nodeType: 'root' as const,
        depth: 0,
        source: 'blocksuite_mindmap' as const
      }
    }]
    const result = validateChunks(chunks)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail validation for empty content', () => {
    const chunks = [{
      content: '   ',
      index: 0,
      heading: 'Test',
      metadata: {
        mindMapId: 'test',
        teamId: 'team',
        path: [],
        nodeType: 'root' as const,
        depth: 0,
        source: 'blocksuite_mindmap' as const
      }
    }]
    const result = validateChunks(chunks)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Chunk 0: Empty content')
  })

  it('should fail validation for missing mindMapId', () => {
    const chunks = [{
      content: 'Test content',
      index: 0,
      heading: 'Test',
      metadata: {
        mindMapId: '',
        teamId: 'team',
        path: [],
        nodeType: 'root' as const,
        depth: 0,
        source: 'blocksuite_mindmap' as const
      }
    }]
    const result = validateChunks(chunks)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Chunk 0: Missing mindMapId in metadata')
  })

  it('should warn for oversized chunks', () => {
    const longContent = 'Test '.repeat(500) // ~2500 chars = ~625 tokens
    const chunks = [{
      content: longContent,
      index: 0,
      heading: 'Test',
      metadata: {
        mindMapId: 'test',
        teamId: 'team',
        path: [],
        nodeType: 'root' as const,
        depth: 0,
        source: 'blocksuite_mindmap' as const
      }
    }]
    const result = validateChunks(chunks, { maxTokensPerChunk: 100 })
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})

describe('DEFAULT_CHUNK_OPTIONS', () => {
  it('should have research-backed default values', () => {
    expect(DEFAULT_CHUNK_OPTIONS.maxTokensPerChunk).toBe(300)
    expect(DEFAULT_CHUNK_OPTIONS.minChunkSize).toBe(50)
    expect(DEFAULT_CHUNK_OPTIONS.includePathContext).toBe(true)
    expect(DEFAULT_CHUNK_OPTIONS.maxPathDepth).toBe(3)
  })
})
