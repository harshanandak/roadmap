/**
 * Resource Types - Inspiration & Resources Module
 *
 * Types for the resources system with:
 * - Global search across resources
 * - Many-to-many relationship with work items
 * - Soft delete with 30-day recycle bin
 * - Full audit trail
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const RESOURCE_TYPES = [
  'reference',      // General links, bookmarks, URLs
  'inspiration',    // Competitor examples, design ideas, benchmarks
  'documentation',  // Tutorials, guides, articles, specs
  'media',          // Videos, images, screenshots
  'tool',           // Tools, utilities, services
] as const;

export type ResourceType = typeof RESOURCE_TYPES[number];

export const TAB_TYPES = ['inspiration', 'resource'] as const;
export type TabType = typeof TAB_TYPES[number];

export const AUDIT_ACTIONS = [
  'created',
  'updated',
  'deleted',
  'restored',
  'linked',
  'unlinked',
] as const;

export type AuditAction = typeof AUDIT_ACTIONS[number];

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Resource - Core resource entity
 */
export interface Resource {
  id: string;
  team_id: string;
  workspace_id: string;
  title: string;
  url: string | null;
  description: string | null;
  notes: string | null;
  resource_type: ResourceType;
  image_url: string | null;
  favicon_url: string | null;
  source_domain: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_modified_by: string | null;
}

/**
 * Resource with additional computed fields
 */
export interface ResourceWithMeta extends Resource {
  linked_work_items_count?: number;
  search_rank?: number;
  days_until_purge?: number;
  created_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * WorkItemResource - Junction table for many-to-many
 */
export interface WorkItemResource {
  work_item_id: string;
  resource_id: string;
  team_id: string;
  tab_type: TabType;
  display_order: number;
  context_note: string | null;
  added_by: string;
  added_at: string;
  is_unlinked: boolean;
  unlinked_at: string | null;
  unlinked_by: string | null;
}

/**
 * WorkItemResource with resource details
 */
export interface WorkItemResourceWithDetails extends WorkItemResource {
  resource: Resource;
  added_by_user?: {
    id: string;
    name: string;
  };
}

/**
 * ResourceAuditLog - Audit trail entry
 */
export interface ResourceAuditLog {
  id: string;
  resource_id: string;
  work_item_id: string | null;
  action: AuditAction;
  actor_id: string;
  actor_email: string | null;
  performed_at: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  team_id: string;
  workspace_id: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create resource request
 */
export interface CreateResourceRequest {
  workspace_id: string;
  team_id: string;
  title: string;
  url?: string;
  description?: string;
  notes?: string;
  resource_type?: ResourceType;
  image_url?: string;
  // Optional: immediately link to a work item
  work_item_id?: string;
  tab_type?: TabType;
  context_note?: string;
}

/**
 * Update resource request
 */
export interface UpdateResourceRequest {
  title?: string;
  url?: string;
  description?: string;
  notes?: string;
  resource_type?: ResourceType;
  image_url?: string;
  favicon_url?: string;
  source_domain?: string;
}

/**
 * Search resources request
 */
export interface SearchResourcesRequest {
  team_id: string;
  workspace_id?: string;
  query?: string;
  resource_type?: ResourceType;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Search resources response
 */
export interface SearchResourcesResponse {
  data: ResourceWithMeta[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

/**
 * Link resource to work item request
 */
export interface LinkResourceRequest {
  resource_id: string;
  tab_type?: TabType;
  context_note?: string;
  display_order?: number;
}

/**
 * Create and link resource request
 */
export interface CreateAndLinkResourceRequest extends CreateResourceRequest {
  work_item_id: string;
}

/**
 * Get resources for work item response
 */
export interface WorkItemResourcesResponse {
  inspiration: WorkItemResourceWithDetails[];
  resources: WorkItemResourceWithDetails[];
}

/**
 * Resource history response
 */
export interface ResourceHistoryResponse {
  data: ResourceAuditLog[];
  resource: Resource;
}

// ============================================================================
// SOFT DELETE TYPES (Reusable pattern)
// ============================================================================

/**
 * Soft deletable entity interface
 */
export interface SoftDeletable {
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
}

/**
 * Trash item with days remaining
 */
export interface TrashItem<T extends SoftDeletable> {
  item: T;
  days_remaining: number;
  can_restore: boolean;
}

/**
 * Restore item request
 */
export interface RestoreRequest {
  id: string;
}

/**
 * Permanent delete request
 */
export interface PermanentDeleteRequest {
  id: string;
  confirm: boolean; // Must be true to proceed
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Resource filter state
 */
export interface ResourceFilterState {
  search: string;
  type: ResourceType | 'all';
  showDeleted: boolean;
}

/**
 * Resource tab state
 */
export interface ResourceTabState {
  activeTab: TabType;
  inspiration: WorkItemResourceWithDetails[];
  resources: WorkItemResourceWithDetails[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate days remaining until permanent deletion
 */
export function calculateDaysRemaining(deletedAt: string | null, retentionDays = 30): number {
  if (!deletedAt) return retentionDays;

  const deletedDate = new Date(deletedAt);
  const purgeDate = new Date(deletedDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  const now = new Date();

  const msRemaining = purgeDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Get resource type label for UI
 */
export function getResourceTypeLabel(type: ResourceType): string {
  const labels: Record<ResourceType, string> = {
    reference: 'Reference',
    inspiration: 'Inspiration',
    documentation: 'Documentation',
    media: 'Media',
    tool: 'Tool',
  };
  return labels[type];
}

/**
 * Get tab type label for UI
 */
export function getTabTypeLabel(tab: TabType): string {
  return tab === 'inspiration' ? 'Inspiration' : 'Resources';
}
