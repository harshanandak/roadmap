/**
 * Parallel AI Tools for Vercel AI SDK
 *
 * Registers Parallel AI APIs as AI SDK tools that can be invoked by AI models.
 * This enables agentic workflows where the AI can:
 * - Search the web for current information
 * - Extract data from URLs
 * - Conduct deep research on complex topics
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────┐
 * │         AI Model (Claude, GPT via OpenRouter)           │
 * │                    "The Brain"                          │
 * └───────────────────────┬─────────────────────────────────┘
 *                         │ tool calls
 * ┌───────────────────────▼─────────────────────────────────┐
 * │               Parallel AI (Tool Layer)                   │
 * │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
 * │  │  Search  │ │ Extract  │ │ Research │ │  Quick   │   │
 * │  │   Tool   │ │   Tool   │ │   Tool   │ │   Chat   │   │
 * │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
 * └─────────────────────────────────────────────────────────┘
 */

import { tool } from 'ai'
import { z } from 'zod'
import {
  parallelSearch,
  parallelExtract,
  parallelTask,
  parallelTaskStatus,
  pollTaskUntilComplete,
  quickChat,
  type TaskProcessor,
  type ParallelSearchResult,
} from '../parallel-ai'

/**
 * Web Search Tool
 *
 * Searches the web for current information using Parallel AI Search API.
 * Returns optimized, AI-ready search results with titles, URLs, and content snippets.
 */
export const webSearchTool = tool({
  description:
    'Search the web for current information. Use this when you need up-to-date data, news, documentation, or any information that might have changed recently. Returns relevant web pages with titles and content snippets.',
  parameters: z.object({
    query: z
      .string()
      .min(3)
      .describe('The search query. Be specific and descriptive for better results.'),
    maxResults: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .default(5)
      .describe('Maximum number of results to return (1-20, default: 5)'),
  }),
  execute: async ({ query, maxResults }): Promise<{
    success: boolean
    results: ParallelSearchResult[]
    query: string
    error?: string
  }> => {
    try {
      const response = await parallelSearch({
        objective: query,
        maxResults: maxResults || 5,
      })

      return {
        success: true,
        results: response.results || [],
        query: response.query,
      }
    } catch (error) {
      return {
        success: false,
        results: [],
        query,
        error: error instanceof Error ? error.message : 'Search failed',
      }
    }
  },
})

/**
 * URL Content Extraction Tool
 *
 * Extracts and structures content from web pages using Parallel AI Extract API.
 * Useful for reading articles, documentation, or any web page content.
 */
export const extractContentTool = tool({
  description:
    'Extract content from one or more URLs. Use this to read the full content of web pages, articles, or documentation. Returns structured content in markdown format.',
  parameters: z.object({
    urls: z
      .array(z.string().url())
      .min(1)
      .max(5)
      .describe('Array of URLs to extract content from (1-5 URLs)'),
    objective: z
      .string()
      .describe(
        'What specific information to extract from the pages. Be specific about what you need.'
      ),
    format: z
      .enum(['text', 'markdown', 'json'])
      .optional()
      .default('markdown')
      .describe('Output format for extracted content'),
  }),
  execute: async ({ urls, objective, format }) => {
    try {
      const results = await parallelExtract({
        urls,
        objective,
        format: format || 'markdown',
      })

      return {
        success: true,
        extractions: results.map((r) => ({
          url: r.url,
          title: r.title,
          content: r.content,
          metadata: r.metadata,
        })),
      }
    } catch (error) {
      return {
        success: false,
        extractions: [],
        error: error instanceof Error ? error.message : 'Extraction failed',
      }
    }
  },
})

/**
 * Deep Research Tool
 *
 * Conducts comprehensive research on a topic using Parallel AI Task API.
 * This is an async operation that takes time but provides thorough results.
 */
export const deepResearchTool = tool({
  description:
    'Conduct deep, comprehensive research on a complex topic. This takes longer (30 seconds to several minutes) but provides thorough, well-researched results. Use for complex questions that require multi-source analysis.',
  parameters: z.object({
    topic: z
      .string()
      .min(10)
      .describe(
        'The research topic or question. Be detailed and specific for better results.'
      ),
    depth: z
      .enum(['lite', 'base', 'core', 'pro', 'ultra'])
      .optional()
      .default('base')
      .describe(
        'Research depth: lite (~30s), base (~1-2min), core (~2-4min), pro (~3-9min), ultra (~5-25min)'
      ),
    waitForCompletion: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to wait for the research to complete or return immediately with a task ID'),
  }),
  execute: async ({ topic, depth, waitForCompletion }) => {
    try {
      const processor = (depth || 'base') as TaskProcessor
      const task = await parallelTask({
        input: topic,
        processor,
      })

      if (!waitForCompletion) {
        return {
          success: true,
          status: 'started',
          runId: task.run_id,
          message: `Research task started. Poll status with run_id: ${task.run_id}`,
        }
      }

      // Wait for completion with polling
      const result = await pollTaskUntilComplete(task.run_id)

      if (result.status === 'failed') {
        return {
          success: false,
          status: 'failed',
          runId: task.run_id,
          error: result.error || 'Research task failed',
        }
      }

      return {
        success: true,
        status: 'completed',
        runId: task.run_id,
        result: result.result,
        metadata: result.metadata,
      }
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Research failed',
      }
    }
  },
})

/**
 * Research Status Tool
 *
 * Check the status of an ongoing deep research task.
 */
export const researchStatusTool = tool({
  description:
    'Check the status of an ongoing deep research task. Use this to poll for results if you started research with waitForCompletion: false.',
  parameters: z.object({
    runId: z.string().describe('The run_id returned when starting the research task'),
  }),
  execute: async ({ runId }) => {
    try {
      const status = await parallelTaskStatus(runId)

      return {
        success: true,
        status: status.status,
        runId,
        result: status.result,
        error: status.error,
        metadata: status.metadata,
      }
    } catch (error) {
      return {
        success: false,
        status: 'error',
        runId,
        error: error instanceof Error ? error.message : 'Status check failed',
      }
    }
  },
})

/**
 * Quick Answer Tool
 *
 * Get a fast AI-generated answer using Parallel AI Chat API.
 * Useful for quick summaries, explanations, or simple questions.
 */
export const quickAnswerTool = tool({
  description:
    'Get a quick AI-generated answer to a simple question. This is fast but less thorough than deep research. Use for summaries, explanations, or simple factual questions.',
  parameters: z.object({
    question: z.string().describe('The question to answer'),
    context: z
      .string()
      .optional()
      .describe('Optional context or system instructions to guide the answer'),
  }),
  execute: async ({ question, context }) => {
    try {
      const answer = await quickChat(question, context)

      return {
        success: true,
        answer,
        question,
      }
    } catch (error) {
      return {
        success: false,
        answer: '',
        question,
        error: error instanceof Error ? error.message : 'Quick answer failed',
      }
    }
  },
})

/**
 * All Parallel AI tools bundled together
 *
 * Use this in your chat routes to give the AI access to all Parallel AI capabilities:
 *
 * @example
 * import { streamText } from 'ai'
 * import { openrouter } from '@/lib/ai/ai-sdk-client'
 * import { parallelAITools } from '@/lib/ai/tools/parallel-ai-tools'
 *
 * const result = await streamText({
 *   model: openrouter('anthropic/claude-3.5-sonnet'),
 *   messages,
 *   tools: parallelAITools,
 * })
 */
export const parallelAITools = {
  webSearch: webSearchTool,
  extractContent: extractContentTool,
  deepResearch: deepResearchTool,
  researchStatus: researchStatusTool,
  quickAnswer: quickAnswerTool,
}

/**
 * Subset of tools for quick operations (no long-running tasks)
 */
export const parallelAIQuickTools = {
  webSearch: webSearchTool,
  extractContent: extractContentTool,
  quickAnswer: quickAnswerTool,
}

/**
 * Research-focused tools (includes long-running operations)
 */
export const parallelAIResearchTools = {
  webSearch: webSearchTool,
  extractContent: extractContentTool,
  deepResearch: deepResearchTool,
  researchStatus: researchStatusTool,
}

export default parallelAITools
