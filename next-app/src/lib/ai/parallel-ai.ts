/**
 * Parallel AI Client
 *
 * Comprehensive client for Parallel AI APIs:
 * - Search: Web search with AI-optimized results
 * - Extract: Content extraction from URLs
 * - Chat: Fast AI chat completions (speed/quality models)
 * - Task: Deep research with async processing (lite/base/core/pro/ultra)
 *
 * API Documentation: https://docs.parallel.ai/home
 */

// API Configuration
const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY

const ENDPOINTS = {
  search: 'https://api.parallel.ai/v1beta/search',
  extract: 'https://api.parallel.ai/v1beta/extract',
  chat: 'https://api.parallel.ai/chat/completions',
  task: 'https://api.parallel.ai/v1/tasks/runs',
  taskStatus: (runId: string) => `https://api.parallel.ai/v1/tasks/runs/${runId}`,
}

const BETA_HEADER = 'search-extract-2025-10-10'

// =============================================================================
// TYPES
// =============================================================================

export interface ParallelSearchResult {
  title: string
  url: string
  content: string
  snippet?: string
  score?: number
}

export interface ParallelSearchResponse {
  results: ParallelSearchResult[]
  query: string
  totalResults?: number
}

export interface ParallelExtractResponse {
  url: string
  content: string
  title?: string
  metadata?: Record<string, any>
}

export interface ParallelChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ParallelChatResponse {
  id: string
  model: string
  choices: Array<{
    message: ParallelChatMessage
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export type TaskProcessor = 'lite' | 'base' | 'core' | 'pro' | 'ultra'

export interface ParallelTaskResponse {
  run_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  error?: string
  metadata?: {
    processor: TaskProcessor
    created_at: string
    completed_at?: string
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getApiKey(): string {
  if (!PARALLEL_API_KEY) {
    throw new Error('PARALLEL_API_KEY not configured in environment variables')
  }
  return PARALLEL_API_KEY
}

function buildHeaders(authType: 'api-key' | 'bearer', includeBeta: boolean = false): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (authType === 'api-key') {
    headers['x-api-key'] = getApiKey()
  } else {
    headers['Authorization'] = `Bearer ${getApiKey()}`
  }

  if (includeBeta) {
    headers['parallel-beta'] = BETA_HEADER
  }

  return headers
}

// =============================================================================
// SEARCH API
// =============================================================================

export interface SearchOptions {
  objective: string
  maxResults?: number // default: 5
  includeRaw?: boolean
}

/**
 * Search the web using Parallel AI
 *
 * @example
 * const results = await parallelSearch({
 *   objective: 'Best practices for React state management 2025',
 *   maxResults: 10
 * })
 */
export async function parallelSearch(options: SearchOptions): Promise<ParallelSearchResponse> {
  const { objective, maxResults = 5 } = options

  const response = await fetch(ENDPOINTS.search, {
    method: 'POST',
    headers: buildHeaders('api-key', true),
    body: JSON.stringify({
      objective,
      max_results: maxResults,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Parallel Search failed: ${response.statusText}`)
  }

  return response.json()
}

// =============================================================================
// EXTRACT API
// =============================================================================

export interface ExtractOptions {
  urls: string[]
  objective: string
  format?: 'text' | 'markdown' | 'json'
}

/**
 * Extract content from URLs using Parallel AI
 *
 * @example
 * const extracted = await parallelExtract({
 *   urls: ['https://example.com/article'],
 *   objective: 'Extract the main points and key takeaways'
 * })
 */
export async function parallelExtract(
  options: ExtractOptions
): Promise<ParallelExtractResponse[]> {
  const { urls, objective, format = 'markdown' } = options

  const response = await fetch(ENDPOINTS.extract, {
    method: 'POST',
    headers: buildHeaders('api-key', true),
    body: JSON.stringify({
      urls,
      objective,
      format,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Parallel Extract failed: ${response.statusText}`)
  }

  return response.json()
}

// =============================================================================
// CHAT API
// =============================================================================

export type ChatModel = 'speed' | 'quality'

export interface ChatOptions {
  model?: ChatModel // default: 'speed'
  messages: ParallelChatMessage[]
  temperature?: number // 0.0-1.0
  maxTokens?: number
  stream?: boolean
}

/**
 * Chat with Parallel AI models
 *
 * @example
 * const response = await parallelChat({
 *   model: 'speed',
 *   messages: [
 *     { role: 'system', content: 'You are a helpful assistant.' },
 *     { role: 'user', content: 'Explain React hooks in simple terms.' }
 *   ]
 * })
 */
export async function parallelChat(options: ChatOptions): Promise<ParallelChatResponse> {
  const { model = 'speed', messages, temperature, maxTokens, stream = false } = options

  const body: Record<string, any> = {
    model,
    messages,
    stream,
  }

  if (temperature !== undefined) body.temperature = temperature
  if (maxTokens !== undefined) body.max_tokens = maxTokens

  const response = await fetch(ENDPOINTS.chat, {
    method: 'POST',
    headers: buildHeaders('bearer'),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Parallel Chat failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Stream chat response from Parallel AI
 */
export async function parallelChatStream(
  options: Omit<ChatOptions, 'stream'>
): Promise<ReadableStream<Uint8Array>> {
  const { model = 'speed', messages, temperature, maxTokens } = options

  const body: Record<string, any> = {
    model,
    messages,
    stream: true,
  }

  if (temperature !== undefined) body.temperature = temperature
  if (maxTokens !== undefined) body.max_tokens = maxTokens

  const response = await fetch(ENDPOINTS.chat, {
    method: 'POST',
    headers: buildHeaders('bearer'),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Parallel Chat stream failed: ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('No response body for streaming')
  }

  return response.body
}

// =============================================================================
// TASK API (Deep Research)
// =============================================================================

export interface TaskOptions {
  input: string
  processor?: TaskProcessor // default: 'base'
}

/**
 * Start a deep research task using Parallel AI
 *
 * Processors (processing time):
 * - lite: Quick research (~30s)
 * - base: Standard research (~1-2min)
 * - core: Thorough research (~2-4min)
 * - pro: Deep research (~3-9min)
 * - ultra: Comprehensive research (~5-25min)
 *
 * @example
 * // Start a deep research task
 * const task = await parallelTask({
 *   input: 'Comprehensive analysis of AI trends in product management 2025',
 *   processor: 'pro'
 * })
 *
 * // Poll for results
 * const result = await parallelTaskStatus(task.run_id)
 */
export async function parallelTask(options: TaskOptions): Promise<ParallelTaskResponse> {
  const { input, processor = 'base' } = options

  const response = await fetch(ENDPOINTS.task, {
    method: 'POST',
    headers: buildHeaders('api-key'),
    body: JSON.stringify({
      input,
      processor,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Parallel Task failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get status of a deep research task
 */
export async function parallelTaskStatus(runId: string): Promise<ParallelTaskResponse> {
  const response = await fetch(ENDPOINTS.taskStatus(runId), {
    method: 'GET',
    headers: buildHeaders('api-key'),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Parallel Task status failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Poll a task until completion with exponential backoff
 *
 * @param runId - Task run ID
 * @param maxAttempts - Maximum polling attempts (default: 60)
 * @param initialDelay - Initial delay in ms (default: 2000)
 * @param maxDelay - Maximum delay in ms (default: 30000)
 */
export async function pollTaskUntilComplete(
  runId: string,
  maxAttempts: number = 60,
  initialDelay: number = 2000,
  maxDelay: number = 30000
): Promise<ParallelTaskResponse> {
  let delay = initialDelay
  let attempts = 0

  while (attempts < maxAttempts) {
    const status = await parallelTaskStatus(runId)

    if (status.status === 'completed' || status.status === 'failed') {
      return status
    }

    // Exponential backoff with jitter
    await new Promise((resolve) =>
      setTimeout(resolve, delay + Math.random() * 1000)
    )
    delay = Math.min(delay * 1.5, maxDelay)
    attempts++
  }

  throw new Error(`Task ${runId} did not complete within ${maxAttempts} attempts`)
}

// =============================================================================
// HIGH-LEVEL HELPERS
// =============================================================================

/**
 * Quick web search with formatted results
 */
export async function quickSearch(query: string): Promise<string> {
  const results = await parallelSearch({ objective: query, maxResults: 5 })

  if (!results.results || results.results.length === 0) {
    return 'No results found.'
  }

  return results.results
    .map(
      (r, i) =>
        `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet || r.content?.slice(0, 200) || ''}`
    )
    .join('\n\n')
}

/**
 * Quick AI chat (fast response)
 */
export async function quickChat(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: ParallelChatMessage[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: prompt })

  const response = await parallelChat({ model: 'speed', messages })
  return response.choices[0]?.message?.content || ''
}

/**
 * Deep research with automatic polling
 */
export async function deepResearch(
  query: string,
  processor: TaskProcessor = 'pro'
): Promise<string> {
  const task = await parallelTask({ input: query, processor })
  const result = await pollTaskUntilComplete(task.run_id)

  if (result.status === 'failed') {
    throw new Error(result.error || 'Deep research task failed')
  }

  return result.result || ''
}

// =============================================================================
// EXPORTS
// =============================================================================

export const ParallelAI = {
  // Core APIs
  search: parallelSearch,
  extract: parallelExtract,
  chat: parallelChat,
  chatStream: parallelChatStream,
  task: parallelTask,
  taskStatus: parallelTaskStatus,
  pollTask: pollTaskUntilComplete,

  // High-level helpers
  quickSearch,
  quickChat,
  deepResearch,
}

export default ParallelAI
