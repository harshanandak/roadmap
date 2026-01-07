/**
 * Tests for text-extractor.ts
 */

import { describe, it, expect } from 'vitest'
import {
  extractTextFromBlockSuiteTree,
  computeTreeHash,
  walkBlockSuiteTree,
  getTreeStats
} from '../text-extractor'
import type { BlockSuiteMindmapNode } from '../mindmap-types'

describe('extractTextFromBlockSuiteTree', () => {
  it('should return empty result for null tree', () => {
    const result = extractTextFromBlockSuiteTree(null)
    expect(result.nodes).toHaveLength(0)
    expect(result.flatText).toBe('')
    expect(result.totalNodes).toBe(0)
    expect(result.maxDepth).toBe(0)
  })

  it('should extract text from simple tree', () => {
    const tree: BlockSuiteMindmapNode = {
      text: 'Root',
      children: [
        { text: 'Child 1', children: [] },
        { text: 'Child 2', children: [] }
      ]
    }
    const result = extractTextFromBlockSuiteTree(tree)
    expect(result.totalNodes).toBe(3)
    expect(result.maxDepth).toBe(1)
    expect(result.flatText).toContain('Root')
    expect(result.flatText).toContain('Child 1')
    expect(result.flatText).toContain('Child 2')
  })

  it('should preserve path context', () => {
    const tree: BlockSuiteMindmapNode = {
      text: 'Root',
      children: [
        {
          text: 'Branch',
          children: [
            { text: 'Leaf', children: [] }
          ]
        }
      ]
    }
    const result = extractTextFromBlockSuiteTree(tree)
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].children[0].children[0].fullPath).toBe('Root > Branch > Leaf')
  })

  it('should respect maxDepth option', () => {
    const tree: BlockSuiteMindmapNode = {
      text: 'Root',
      children: [
        {
          text: 'Branch',
          children: [
            { text: 'Leaf', children: [] }
          ]
        }
      ]
    }
    const result = extractTextFromBlockSuiteTree(tree, { maxDepth: 1 })
    expect(result.maxDepth).toBe(1)
    // Should not include depth 2 nodes
  })

  it('should use default maxDepth of 50 for safety', () => {
    // Create a deeply nested tree
    let tree: BlockSuiteMindmapNode = { text: 'Level 0', children: [] }
    let current = tree
    for (let i = 1; i <= 55; i++) {
      const child: BlockSuiteMindmapNode = { text: `Level ${i}`, children: [] }
      current.children = [child]
      current = child
    }

    const result = extractTextFromBlockSuiteTree(tree)
    // Should stop at depth 50 due to default maxDepth
    expect(result.maxDepth).toBeLessThanOrEqual(50)
  })
})

describe('computeTreeHash', () => {
  it('should return empty hash for null tree', () => {
    const result = computeTreeHash(null)
    expect(result.hash).toBe('empty')
    expect(result.nodeCount).toBe(0)
    expect(result.charCount).toBe(0)
  })

  it('should compute consistent hash', () => {
    const tree: BlockSuiteMindmapNode = {
      text: 'Root',
      children: [{ text: 'Child', children: [] }]
    }
    const result1 = computeTreeHash(tree)
    const result2 = computeTreeHash(tree)
    expect(result1.hash).toBe(result2.hash)
    expect(result1.nodeCount).toBe(2)
  })

  it('should produce different hash for different trees', () => {
    const tree1: BlockSuiteMindmapNode = {
      text: 'Root',
      children: [{ text: 'Child 1', children: [] }]
    }
    const tree2: BlockSuiteMindmapNode = {
      text: 'Root',
      children: [{ text: 'Child 2', children: [] }]
    }
    expect(computeTreeHash(tree1).hash).not.toBe(computeTreeHash(tree2).hash)
  })
})

describe('walkBlockSuiteTree', () => {
  it('should visit all nodes', () => {
    const tree: BlockSuiteMindmapNode = {
      text: 'Root',
      children: [
        { text: 'Child 1', children: [] },
        { text: 'Child 2', children: [] }
      ]
    }
    const visited: string[] = []
    walkBlockSuiteTree(tree, (node) => {
      visited.push(node.text)
    })
    expect(visited).toEqual(['Root', 'Child 1', 'Child 2'])
  })

  it('should stop when callback returns false', () => {
    const tree: BlockSuiteMindmapNode = {
      text: 'Root',
      children: [
        { text: 'Child 1', children: [] },
        { text: 'Child 2', children: [] }
      ]
    }
    const visited: string[] = []
    walkBlockSuiteTree(tree, (node) => {
      visited.push(node.text)
      return node.text !== 'Child 1' // Stop after Child 1
    })
    expect(visited).toEqual(['Root', 'Child 1'])
  })
})

describe('getTreeStats', () => {
  it('should return zeros for null tree', () => {
    const stats = getTreeStats(null)
    expect(stats.nodeCount).toBe(0)
    expect(stats.maxDepth).toBe(0)
    expect(stats.leafCount).toBe(0)
  })

  it('should compute correct statistics', () => {
    const tree: BlockSuiteMindmapNode = {
      text: 'Root',
      children: [
        { text: 'Branch', children: [
          { text: 'Leaf 1', children: [] },
          { text: 'Leaf 2', children: [] }
        ]},
        { text: 'Single', children: [] }
      ]
    }
    const stats = getTreeStats(tree)
    expect(stats.nodeCount).toBe(5)
    expect(stats.maxDepth).toBe(2)
    expect(stats.leafCount).toBe(3) // Leaf 1, Leaf 2, Single
    expect(stats.branchCount).toBe(2) // Root, Branch
  })
})
