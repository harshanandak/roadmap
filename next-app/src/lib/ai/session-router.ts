/**
 * Session Router
 *
 * Orchestrates intelligent model selection and context management for chat sessions.
 *
 * Key Principles:
 * 1. Session Persistence - Once a chat starts with a model, it continues with that model
 * 2. Context Compaction - Summarize older messages before switching models
 * 3. Capability-Based Routing - Select models by capability, not by name
 * 4. User Override - User selection always takes priority
 *
 * Routing Priority:
 * 1. User's explicit model selection → Use that model
 * 2. Session has existing model → Continue with same model (compact if needed)
 * 3. Context overflow after compaction → Switch to large_context model
 * 4. Tool-heavy request → Use tool_use capable model
 * 5. Default → Use default model
 *
 * @see models-config.ts for model definitions
 * @see context-compactor.ts for compaction logic
 */

import type { CoreMessage, LanguageModel } from 'ai'
import {
  type ModelConfig,
  type ModelCapability,
  getDefaultModel,
  getModelByKey,
  getModelByCapability,
} from './models-config'
import {
  estimateConversationTokens,
  compactContext,
  needsLargerContext,
  getOverflowModel,
  type CompactionResult,
} from './context-compactor'
import { openrouter } from './ai-sdk-client'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Session state tracked per conversation
 */
export interface SessionState {
  /** Unique session identifier */
  sessionId: string

  /** Current model key (from MODEL_REGISTRY) */
  modelKey: string

  /** Whether user explicitly selected this model */
  userOverride: boolean

  /** Whether context has been compacted in this session */
  hasCompacted: boolean

  /** Number of messages at last compaction */
  lastCompactedAt?: number

  /** Created timestamp */
  createdAt: number

  /** Last updated timestamp */
  updatedAt: number
}

/**
 * Routing decision result
 */
export interface RoutingDecision {
  /** Selected model configuration */
  model: ModelConfig

  /** AI SDK language model instance */
  languageModel: LanguageModel

  /** Messages to use (may be compacted) */
  messages: CoreMessage[]

  /** Why this model was selected */
  reason: RoutingReason

  /** Context compaction result (if performed) */
  compaction?: CompactionResult

  /** Updated session state */
  session: SessionState
}

/**
 * Reasons for model selection
 */
export type RoutingReason =
  | 'user_override'        // User explicitly selected this model
  | 'session_persistence'  // Continuing with session's existing model
  | 'context_overflow'     // Switched to larger context model
  | 'tool_use'             // Request requires tool calling
  | 'default'              // No specific requirements, using default

/**
 * Request context for routing decisions
 */
export interface RoutingContext {
  /** Current conversation messages */
  messages: CoreMessage[]

  /** User's model selection (if any) */
  userModelKey?: string | null

  /** Existing session state (if continuing) */
  session?: SessionState | null

  /** Whether request involves tool use */
  hasToolUse?: boolean

  /** Specific capability requirement */
  requiredCapability?: ModelCapability
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Create a new session state
 */
export function createSession(
  sessionId: string,
  modelKey: string,
  userOverride: boolean = false
): SessionState {
  const now = Date.now()
  return {
    sessionId,
    modelKey,
    userOverride,
    hasCompacted: false,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Update session state
 */
export function updateSession(
  session: SessionState,
  updates: Partial<Omit<SessionState, 'sessionId' | 'createdAt'>>
): SessionState {
  return {
    ...session,
    ...updates,
    updatedAt: Date.now(),
  }
}

// =============================================================================
// ROUTING LOGIC
// =============================================================================

/**
 * Route a chat request to the appropriate model
 *
 * This is the main entry point for model selection.
 * It handles all routing priorities and context management.
 *
 * @param context - Request context with messages and session
 * @returns Routing decision with model and processed messages
 */
export async function routeRequest(context: RoutingContext): Promise<RoutingDecision> {
  const { messages, userModelKey, session, hasToolUse, requiredCapability } = context

  // Priority 1: User's explicit model selection
  if (userModelKey && userModelKey !== 'auto') {
    const userModel = getModelByKey(userModelKey)
    if (userModel) {
      return createDecision(
        userModel,
        messages,
        'user_override',
        session
          ? updateSession(session, { modelKey: userModel.key, userOverride: true })
          : createSession(generateSessionId(), userModel.key, true)
      )
    }
  }

  // Priority 2: Session persistence (continue with existing model)
  if (session && !session.userOverride) {
    const sessionModel = getModelByKey(session.modelKey)
    if (sessionModel) {
      // Check if we need to compact context
      const estimate = estimateConversationTokens(messages, sessionModel)

      if (estimate.nearLimit) {
        // Try compacting first
        const compaction = await compactContext(messages, sessionModel)

        if (compaction.wasCompacted && !needsLargerContext(compaction.estimatedTokens, sessionModel)) {
          // Compaction was enough, continue with same model
          return createDecision(
            sessionModel,
            compaction.messages,
            'session_persistence',
            updateSession(session, {
              hasCompacted: true,
              lastCompactedAt: messages.length,
            }),
            compaction
          )
        }

        // Priority 3: Context overflow - need larger model
        const overflowModel = getOverflowModel()
        if (overflowModel) {
          return createDecision(
            overflowModel,
            compaction.messages,
            'context_overflow',
            updateSession(session, {
              modelKey: overflowModel.key,
              hasCompacted: true,
              lastCompactedAt: messages.length,
            }),
            compaction
          )
        }
      }

      // No compaction needed, continue with session model
      return createDecision(
        sessionModel,
        messages,
        'session_persistence',
        session
      )
    }
  }

  // Priority 4: Specific capability requirement
  if (requiredCapability) {
    const capabilityModel = getModelByCapability(requiredCapability)
    if (capabilityModel) {
      return createDecision(
        capabilityModel,
        messages,
        'default', // Using default as this is automatic selection
        session
          ? updateSession(session, { modelKey: capabilityModel.key })
          : createSession(generateSessionId(), capabilityModel.key)
      )
    }
  }

  // Priority 5: Tool-heavy request
  if (hasToolUse) {
    const toolModel = getModelByCapability('tool_use')
    if (toolModel) {
      return createDecision(
        toolModel,
        messages,
        'tool_use',
        session
          ? updateSession(session, { modelKey: toolModel.key })
          : createSession(generateSessionId(), toolModel.key)
      )
    }
  }

  // Priority 6: Default model
  const defaultModel = getDefaultModel()
  return createDecision(
    defaultModel,
    messages,
    'default',
    session
      ? updateSession(session, { modelKey: defaultModel.key })
      : createSession(generateSessionId(), defaultModel.key)
  )
}

/**
 * Create a routing decision object
 */
function createDecision(
  model: ModelConfig,
  messages: CoreMessage[],
  reason: RoutingReason,
  session: SessionState,
  compaction?: CompactionResult
): RoutingDecision {
  return {
    model,
    languageModel: openrouter(model.modelId, model.providerSettings ? { provider: model.providerSettings } : undefined),
    messages,
    reason,
    compaction,
    session,
  }
}

/**
 * Generate a unique session ID
 * Uses crypto.randomUUID() for secure random generation
 */
function generateSessionId(): string {
  // Use crypto.randomUUID() for secure random IDs
  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().split('-')[0]
    : Date.now().toString(36)
  return `session_${Date.now()}_${randomPart}`
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick route for simple requests (no session tracking)
 *
 * Use this for one-off AI operations that don't need session persistence.
 */
export function quickRoute(
  userModelKey?: string | null,
  hasToolUse?: boolean
): { model: ModelConfig; languageModel: LanguageModel } {
  // User override
  if (userModelKey && userModelKey !== 'auto') {
    const userModel = getModelByKey(userModelKey)
    if (userModel) {
      return {
        model: userModel,
        languageModel: openrouter(userModel.modelId, userModel.providerSettings ? { provider: userModel.providerSettings } : undefined),
      }
    }
  }

  // Tool use
  if (hasToolUse) {
    const toolModel = getModelByCapability('tool_use')
    if (toolModel) {
      return {
        model: toolModel,
        languageModel: openrouter(toolModel.modelId, toolModel.providerSettings ? { provider: toolModel.providerSettings } : undefined),
      }
    }
  }

  // Default
  const defaultModel = getDefaultModel()
  return {
    model: defaultModel,
    languageModel: openrouter(defaultModel.modelId, defaultModel.providerSettings ? { provider: defaultModel.providerSettings } : undefined),
  }
}

/**
 * Get model for a specific capability
 *
 * Convenience wrapper for capability-based model selection.
 */
export function getModelForCapability(
  capability: ModelCapability
): { model: ModelConfig; languageModel: LanguageModel } | undefined {
  const model = getModelByCapability(capability)
  if (!model) return undefined

  return {
    model,
    languageModel: openrouter(model.modelId, model.providerSettings ? { provider: model.providerSettings } : undefined),
  }
}

// =============================================================================
// LOGGING / OBSERVABILITY
// =============================================================================

/**
 * Format routing decision for logging
 */
export function formatRoutingLog(decision: RoutingDecision): string {
  const parts = [
    `[Session Router]`,
    `Model: ${decision.model.displayName} (${decision.model.key})`,
    `Reason: ${decision.reason}`,
  ]

  if (decision.compaction?.wasCompacted) {
    parts.push(`Compacted: ${decision.compaction.summarizedCount} messages`)
    parts.push(`Tokens: ${decision.compaction.estimatedTokens}`)
  }

  return parts.join(' | ')
}
