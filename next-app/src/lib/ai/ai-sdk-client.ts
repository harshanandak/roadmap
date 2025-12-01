/**
 * Vercel AI SDK Client with OpenRouter Provider
 *
 * Provides a unified interface for AI operations using the Vercel AI SDK
 * with OpenRouter as the provider layer. This enables:
 * - Access to 300+ models through single endpoint
 * - :nitro routing for maximum throughput
 * - Built-in streaming with `streamText()` / `generateText()`
 * - Tool calling for Parallel AI integration
 * - Type-safe structured output with Zod
 * - Built-in cost tracking via providerMetadata
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import type { LanguageModelV1 } from 'ai'

/**
 * OpenRouter client configuration
 * Uses the same API key as existing openrouter.ts implementation
 */
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  // Default headers for all requests
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Product Lifecycle Platform',
  },
})

/**
 * Pre-configured AI SDK models matching existing model IDs
 * All models use :nitro routing for 30-50% faster throughput
 */
export const aiModels = {
  /**
   * Claude Haiku 4.5 (DEFAULT)
   * Best reasoning, fastest via nitro
   * Cost: $1.00/M input, $5.00/M output
   */
  claudeHaiku: openrouter('anthropic/claude-haiku-4.5:nitro'),

  /**
   * Grok 4 Fast
   * Real-time reasoning, 2M context, fastest via nitro
   * Cost: $0.20/M input, $0.50/M output
   */
  grok4Fast: openrouter('x-ai/grok-4-fast:nitro'),

  /**
   * Kimi K2 Thinking (CHEAPEST)
   * Deep reasoning with thinking traces
   * Cost: $0.15/M input, $2.50/M output
   */
  kimiK2: openrouter('moonshotai/kimi-k2-thinking:nitro'),

  /**
   * Minimax M2
   * Balanced reasoning and speed, good for agentic workflows
   * Cost: $0.50/M input, $1.50/M output
   */
  minimaxM2: openrouter('minimax/minimax-m2:nitro'),

  /**
   * Claude 3.5 Sonnet
   * Higher capability for complex tasks
   * Cost: Higher but more capable
   */
  claudeSonnet: openrouter('anthropic/claude-3.5-sonnet'),

  /**
   * GPT-4o with nitro routing
   * OpenAI's multimodal model
   */
  gpt4o: openrouter('openai/gpt-4o:nitro'),
} as const

/**
 * Model recommendations by use case
 */
export const recommendedModels = {
  /** Fast responses, real-time data (Grok 4) */
  speed: aiModels.grok4Fast,

  /** Best reasoning quality (Claude Haiku 4.5) */
  quality: aiModels.claudeHaiku,

  /** Lowest cost (Kimi K2) */
  cost: aiModels.kimiK2,

  /** Deep reasoning with thinking traces (Kimi K2) */
  thinking: aiModels.kimiK2,

  /** Default model for most tasks */
  default: aiModels.claudeHaiku,

  /** Agentic workflows with tool calling */
  agentic: aiModels.minimaxM2,

  /** Complex multi-step tasks */
  complex: aiModels.claudeSonnet,
} as const

/**
 * Get model by key name
 */
export function getAIModel(
  key: keyof typeof aiModels
): LanguageModelV1 {
  return aiModels[key]
}

/**
 * Get model by OpenRouter model ID
 * Supports dynamic model selection based on user preferences
 */
export function getModelById(modelId: string): LanguageModelV1 {
  return openrouter(modelId)
}

/**
 * Model ID to AI SDK model mapping
 * Maps existing model IDs from models.ts to AI SDK models
 */
export const modelIdMap: Record<string, LanguageModelV1> = {
  'anthropic/claude-haiku-4.5:nitro': aiModels.claudeHaiku,
  'x-ai/grok-4-fast:nitro': aiModels.grok4Fast,
  'moonshotai/kimi-k2-thinking:nitro': aiModels.kimiK2,
  'minimax/minimax-m2:nitro': aiModels.minimaxM2,
  'anthropic/claude-3.5-sonnet': aiModels.claudeSonnet,
  'openai/gpt-4o:nitro': aiModels.gpt4o,
}

/**
 * Get AI SDK model from existing AIModel interface
 * Bridges the gap between existing model config and AI SDK
 */
export function getModelFromConfig(modelId: string): LanguageModelV1 {
  return modelIdMap[modelId] || openrouter(modelId)
}

/**
 * Type for AI SDK model keys
 */
export type AIModelKey = keyof typeof aiModels

/**
 * Type for recommended use cases
 */
export type AIUseCase = keyof typeof recommendedModels
