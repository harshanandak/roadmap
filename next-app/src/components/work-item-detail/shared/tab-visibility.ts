/**
 * Phase-Based Tab Visibility Configuration
 *
 * Defines which tabs are visible for each work item phase.
 * Uses progressive disclosure - tabs appear as work progresses
 * through the lifecycle: research → planning → execution → review → complete
 */

import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import {
  FileText,
  Lightbulb,
  Link2,
  Target,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Bot,
  type LucideIcon,
} from 'lucide-react'

/**
 * Tab identifiers for the 8-tab structure
 */
export type DetailTab =
  | 'summary'
  | 'inspiration'
  | 'resources'
  | 'scope'
  | 'tasks'
  | 'feedback'
  | 'metrics'
  | 'ai-copilot'

/**
 * Tab configuration with metadata
 */
export interface TabConfig {
  id: DetailTab
  label: string
  icon: LucideIcon
  description: string
  /** Phases where this tab is visible */
  visibleInPhases: WorkspacePhase[]
  /** Whether this is a Pro-tier feature */
  isPro?: boolean
}

/**
 * Complete tab configuration for the 8-tab structure
 *
 * Tab Visibility Matrix:
 * | Tab         | research | planning | execution | review | complete |
 * |-------------|:--------:|:--------:|:---------:|:------:|:--------:|
 * | Summary     | ✓        | ✓        | ✓         | ✓      | ✓        |
 * | Inspiration | ✓        | ✓        | -         | -      | -        |
 * | Resources   | ✓        | ✓        | ✓         | ✓      | ✓        |
 * | Scope       | -        | ✓        | ✓         | ✓      | ✓        |
 * | Tasks       | -        | -        | ✓         | ✓      | ✓        |
 * | Feedback    | -        | -        | ✓         | ✓      | ✓        |
 * | Metrics     | -        | -        | ✓         | ✓      | ✓        |
 * | AI Copilot  | ✓        | ✓        | ✓         | ✓      | ✓        |
 */
export const TAB_CONFIG: TabConfig[] = [
  {
    id: 'summary',
    label: 'Summary',
    icon: FileText,
    description: 'Overview, status, and health indicators',
    visibleInPhases: ['research', 'planning', 'execution', 'review', 'complete'],
  },
  {
    id: 'inspiration',
    label: 'Inspiration',
    icon: Lightbulb,
    description: 'Research links, competitor analysis, user quotes',
    visibleInPhases: ['research', 'planning'],
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: Link2,
    description: 'Figma, GitHub, docs, API specs',
    visibleInPhases: ['research', 'planning', 'execution', 'review', 'complete'],
  },
  {
    id: 'scope',
    label: 'Scope',
    icon: Target,
    description: 'Timeline breakdown: MVP, Short-term, Long-term',
    visibleInPhases: ['planning', 'execution', 'review', 'complete'],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    description: 'Execution checklist and task tracking',
    visibleInPhases: ['execution', 'review', 'complete'],
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    description: 'User feedback and stakeholder input',
    visibleInPhases: ['execution', 'review', 'complete'],
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: BarChart3,
    description: 'Performance tracking and analytics',
    visibleInPhases: ['execution', 'review', 'complete'],
    isPro: true,
  },
  {
    id: 'ai-copilot',
    label: 'AI Copilot',
    icon: Bot,
    description: 'Context-aware AI assistant',
    visibleInPhases: ['research', 'planning', 'execution', 'review', 'complete'],
    isPro: true,
  },
]

/**
 * Get visible tabs for a given phase
 */
export function getVisibleTabs(phase: WorkspacePhase): TabConfig[] {
  return TAB_CONFIG.filter((tab) => tab.visibleInPhases.includes(phase))
}

/**
 * Check if a specific tab is visible in the given phase
 */
export function isTabVisible(tabId: DetailTab, phase: WorkspacePhase): boolean {
  const tab = TAB_CONFIG.find((t) => t.id === tabId)
  return tab ? tab.visibleInPhases.includes(phase) : false
}

/**
 * Get the default tab for a given phase
 * Returns 'summary' which is always visible
 */
export function getDefaultTab(): DetailTab {
  return 'summary'
}

/**
 * Get tab config by ID
 */
export function getTabConfig(tabId: DetailTab): TabConfig | undefined {
  return TAB_CONFIG.find((t) => t.id === tabId)
}

/**
 * Get total count of visible tabs for a phase
 */
export function getVisibleTabCount(phase: WorkspacePhase): number {
  return getVisibleTabs(phase).length
}
