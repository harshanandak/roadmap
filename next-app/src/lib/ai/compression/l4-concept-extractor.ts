/**
 * L4 Concept Extractor Service
 *
 * Builds a knowledge graph by extracting:
 * - Concepts: Named entities, processes, decisions, goals, metrics, risks
 * - Relationships: depends_on, part_of, related_to, supports, contradicts, etc.
 *
 * This enables:
 * - High-level conceptual search across all documents
 * - Discovery of implicit relationships between concepts
 * - Visualization of product knowledge as a graph
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createClient } from '@/lib/supabase/server'
import { embedQuery, formatEmbeddingForPgvector, cosineSimilarity } from '../embeddings/embedding-service'
import type {
  KnowledgeConcept,
  ConceptRelationshipInsert,
  ConceptType,
  RelationshipType,
  KnowledgeGraph,
} from '@/lib/types/collective-intelligence'

// =============================================================================
// SCHEMAS
// =============================================================================

const ConceptSchema = z.object({
  name: z.string().describe('The canonical name of this concept'),
  description: z.string().describe('A brief description of what this concept represents'),
  conceptType: z
    .enum([
      'entity',
      'process',
      'decision',
      'goal',
      'metric',
      'risk',
      'person',
      'product',
      'technology',
      'other',
    ])
    .describe('The type/category of this concept'),
  aliases: z.array(z.string()).describe('Alternative names or abbreviations for this concept'),
  attributes: z
    .record(z.string(), z.string())
    .optional()
    .describe('Key-value attributes specific to this concept'),
})

const RelationshipSchema = z.object({
  sourceConcept: z.string().describe('The name of the source concept'),
  targetConcept: z.string().describe('The name of the target concept'),
  relationshipType: z
    .enum([
      'depends_on',
      'part_of',
      'related_to',
      'contradicts',
      'supports',
      'causes',
      'blocks',
      'influences',
      'owned_by',
      'uses',
    ])
    .describe('The type of relationship'),
  strength: z.number().min(0).max(1).describe('Strength of the relationship (0-1)'),
  description: z.string().optional().describe('Brief description of the relationship'),
  evidence: z.string().optional().describe('Quote or reference supporting this relationship'),
})

const ExtractionResultSchema = z.object({
  concepts: z.array(ConceptSchema).describe('Concepts extracted from the document'),
  relationships: z.array(RelationshipSchema).describe('Relationships between concepts'),
})

type ExtractedConcept = z.infer<typeof ConceptSchema>
type _ExtractedRelationship = z.infer<typeof RelationshipSchema>

// =============================================================================
// CONCEPT EXTRACTION
// =============================================================================

export interface ExtractConceptsOptions {
  documentId: string
  documentName: string
  content: string
  existingConcepts?: string[] // Names of existing concepts for reference
  teamId: string
  workspaceId?: string
  model?: string
}

export interface ExtractConceptsResult {
  success: boolean
  conceptsCreated: number
  conceptsUpdated: number
  relationshipsCreated: number
  error?: string
}

/**
 * Extract concepts and relationships from a document
 */
export async function extractConcepts(
  options: ExtractConceptsOptions
): Promise<ExtractConceptsResult> {
  const {
    documentId,
    documentName,
    content,
    existingConcepts = [],
    teamId,
    workspaceId,
    model = 'anthropic/claude-3-haiku-20240307',
  } = options

  try {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    // Truncate content if too long
    const truncatedContent = content.length > 6000 ? content.slice(0, 6000) + '...' : content

    // Build existing concepts context
    const conceptContext =
      existingConcepts.length > 0
        ? `\n\nExisting concepts in the knowledge base (reuse these if they appear): ${existingConcepts.slice(0, 50).join(', ')}`
        : ''

    // Extract concepts and relationships
    const { object: extracted } = await generateObject({
      model: openrouter(model),
      schema: ExtractionResultSchema,
      prompt: `Analyze this document and extract key concepts and their relationships.

Document Name: ${documentName}

Document Content:
${truncatedContent}
${conceptContext}

Extract:
1. Important concepts (people, products, features, processes, decisions, goals, metrics, risks)
2. Relationships between these concepts

Focus on concepts that would be valuable for a product team's knowledge base.
Be specific and avoid overly generic concepts like "user" or "system".`,
    })

    const supabase = await createClient()

    // Store concepts
    const conceptIdMap = new Map<string, string>() // name -> id
    let conceptsCreated = 0
    let conceptsUpdated = 0

    for (const concept of extracted.concepts) {
      const result = await upsertConcept(
        supabase,
        concept,
        documentId,
        teamId,
        workspaceId
      )

      conceptIdMap.set(concept.name.toLowerCase(), result.conceptId)

      if (result.created) {
        conceptsCreated++
      } else {
        conceptsUpdated++
      }
    }

    // Store relationships
    let relationshipsCreated = 0

    for (const rel of extracted.relationships) {
      const sourceId = conceptIdMap.get(rel.sourceConcept.toLowerCase())
      const targetId = conceptIdMap.get(rel.targetConcept.toLowerCase())

      if (sourceId && targetId && sourceId !== targetId) {
        const created = await upsertRelationship(
          supabase,
          {
            sourceConceptId: sourceId,
            targetConceptId: targetId,
            relationshipType: rel.relationshipType as RelationshipType,
            strength: rel.strength,
            description: rel.description,
            evidence: rel.evidence ? [rel.evidence] : [],
            sourceDocuments: [documentId],
          }
        )

        if (created) {
          relationshipsCreated++
        }
      }
    }

    return {
      success: true,
      conceptsCreated,
      conceptsUpdated,
      relationshipsCreated,
    }
  } catch (error) {
    console.error('[L4 Concept Extractor] Error:', error)
    return {
      success: false,
      conceptsCreated: 0,
      conceptsUpdated: 0,
      relationshipsCreated: 0,
      error: error instanceof Error ? error.message : 'Failed to extract concepts',
    }
  }
}

/**
 * Upsert a concept (create or update existing)
 */
async function upsertConcept(
  supabase: Awaited<ReturnType<typeof createClient>>,
  concept: ExtractedConcept,
  documentId: string,
  teamId: string,
  workspaceId?: string
): Promise<{ conceptId: string; created: boolean }> {
  // Generate embedding for the concept
  const conceptText = `${concept.name}: ${concept.description}`
  const embedding = await embedQuery(conceptText)

  // Check if a similar concept already exists
  const { data: existingConcepts } = await supabase
    .from('knowledge_concepts')
    .select('id, name, embedding, source_documents, mention_count')
    .eq('team_id', teamId)
    .or(`name.ilike.%${concept.name}%`)

  let existingConcept = null

  if (existingConcepts) {
    // Check by name similarity first
    for (const existing of existingConcepts) {
      if (existing.name.toLowerCase() === concept.name.toLowerCase()) {
        existingConcept = existing
        break
      }
    }

    // If not found by name, check by embedding similarity
    if (!existingConcept) {
      for (const existing of existingConcepts) {
        if (existing.embedding) {
          try {
            const embeddingArr = JSON.parse(existing.embedding as string)
            const similarity = cosineSimilarity(embedding, embeddingArr)

            if (similarity > 0.9) {
              existingConcept = existing
              break
            }
          } catch {
            // Invalid embedding, skip
          }
        }
      }
    }
  }

  if (existingConcept) {
    // Update existing concept
    const sourceDocs = existingConcept.source_documents || []
    if (!sourceDocs.includes(documentId)) {
      sourceDocs.push(documentId)
    }

    await supabase
      .from('knowledge_concepts')
      .update({
        description: concept.description,
        aliases: concept.aliases,
        attributes: concept.attributes || {},
        source_documents: sourceDocs,
        mention_count: (existingConcept.mention_count || 1) + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', existingConcept.id)

    return { conceptId: existingConcept.id, created: false }
  } else {
    // Create new concept
    const { data: newConcept, error } = await supabase
      .from('knowledge_concepts')
      .insert({
        team_id: teamId,
        workspace_id: workspaceId,
        name: concept.name,
        description: concept.description,
        concept_type: concept.conceptType,
        aliases: concept.aliases,
        attributes: concept.attributes || {},
        embedding: formatEmbeddingForPgvector(embedding),
        source_documents: [documentId],
        mention_count: 1,
        confidence_score: 0.7,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create concept: ${error.message}`)
    }

    return { conceptId: newConcept.id, created: true }
  }
}

/**
 * Upsert a relationship between concepts
 */
async function upsertRelationship(
  supabase: Awaited<ReturnType<typeof createClient>>,
  relationship: ConceptRelationshipInsert
): Promise<boolean> {
  // Check if relationship already exists
  const { data: existing } = await supabase
    .from('concept_relationships')
    .select('id, source_documents')
    .eq('source_concept_id', relationship.sourceConceptId)
    .eq('target_concept_id', relationship.targetConceptId)
    .eq('relationship_type', relationship.relationshipType)
    .single()

  if (existing) {
    // Update existing relationship
    const sourceDocs = existing.source_documents || []
    const newDocs = relationship.sourceDocuments || []

    for (const doc of newDocs) {
      if (!sourceDocs.includes(doc)) {
        sourceDocs.push(doc)
      }
    }

    await supabase
      .from('concept_relationships')
      .update({
        strength: Math.min((relationship.strength || 0.5) + 0.1, 1.0), // Increase strength
        source_documents: sourceDocs,
      })
      .eq('id', existing.id)

    return false
  } else {
    // Create new relationship
    const { error } = await supabase.from('concept_relationships').insert({
      source_concept_id: relationship.sourceConceptId,
      target_concept_id: relationship.targetConceptId,
      relationship_type: relationship.relationshipType,
      strength: relationship.strength || 0.5,
      description: relationship.description,
      evidence: relationship.evidence || [],
      source_documents: relationship.sourceDocuments || [],
      auto_generated: true,
    })

    if (error) {
      console.error('Failed to create relationship:', error)
      return false
    }

    return true
  }
}

/**
 * Batch extract concepts from multiple documents
 */
export async function batchExtractConcepts(
  documents: Array<{ documentId: string; documentName: string; content: string }>,
  teamId: string,
  workspaceId?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<{
  successful: number
  failed: number
  totalConceptsCreated: number
  totalRelationshipsCreated: number
}> {
  let successful = 0
  let failed = 0
  let totalConceptsCreated = 0
  let totalRelationshipsCreated = 0

  // Get existing concepts for context
  const supabase = await createClient()
  const { data: existingConceptsData } = await supabase
    .from('knowledge_concepts')
    .select('name')
    .eq('team_id', teamId)

  const existingConcepts = existingConceptsData?.map((c) => c.name) || []

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i]

    const result = await extractConcepts({
      documentId: doc.documentId,
      documentName: doc.documentName,
      content: doc.content,
      existingConcepts,
      teamId,
      workspaceId,
    })

    if (result.success) {
      successful++
      totalConceptsCreated += result.conceptsCreated
      totalRelationshipsCreated += result.relationshipsCreated
    } else {
      failed++
    }

    onProgress?.(i + 1, documents.length)

    // Small delay to avoid rate limiting
    if (i < documents.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return {
    successful,
    failed,
    totalConceptsCreated,
    totalRelationshipsCreated,
  }
}

/**
 * Get the knowledge graph for a team/workspace
 */
export async function getKnowledgeGraph(
  teamId: string,
  workspaceId?: string,
  limit: number = 50
): Promise<KnowledgeGraph> {
  const supabase = await createClient()

  // Get top concepts
  let conceptQuery = supabase
    .from('knowledge_concepts')
    .select('id, name, concept_type, description, mention_count')
    .eq('team_id', teamId)
    .order('mention_count', { ascending: false })
    .limit(limit)

  if (workspaceId) {
    conceptQuery = conceptQuery.eq('workspace_id', workspaceId)
  }

  const { data: concepts } = await conceptQuery

  if (!concepts || concepts.length === 0) {
    return {
      concepts: [],
      relationships: [],
      stats: {
        totalConcepts: 0,
        totalRelationships: 0,
        topConceptTypes: {} as Record<ConceptType, number>,
        topRelationshipTypes: {} as Record<RelationshipType, number>,
      },
    }
  }

  const conceptIds = concepts.map((c) => c.id)

  // Get relationships between these concepts
  const { data: relationships } = await supabase
    .from('concept_relationships')
    .select('source_concept_id, target_concept_id, relationship_type, strength')
    .in('source_concept_id', conceptIds)
    .in('target_concept_id', conceptIds)

  // Calculate stats
  const conceptTypeCounts: Record<string, number> = {}
  const relationshipTypeCounts: Record<string, number> = {}

  for (const concept of concepts) {
    const type = concept.concept_type || 'other'
    conceptTypeCounts[type] = (conceptTypeCounts[type] || 0) + 1
  }

  for (const rel of relationships || []) {
    const type = rel.relationship_type
    relationshipTypeCounts[type] = (relationshipTypeCounts[type] || 0) + 1
  }

  return {
    concepts: concepts.map((c) => ({
      id: c.id,
      name: c.name,
      conceptType: c.concept_type as ConceptType,
      description: c.description,
      mentionCount: c.mention_count,
    })),
    relationships: (relationships || []).map((r) => ({
      sourceConceptId: r.source_concept_id,
      targetConceptId: r.target_concept_id,
      relationshipType: r.relationship_type as RelationshipType,
      strength: r.strength,
    })),
    stats: {
      totalConcepts: concepts.length,
      totalRelationships: relationships?.length || 0,
      topConceptTypes: conceptTypeCounts as Record<ConceptType, number>,
      topRelationshipTypes: relationshipTypeCounts as Record<RelationshipType, number>,
    },
  }
}

/**
 * Get concepts by type
 */
export async function getConceptsByType(
  teamId: string,
  conceptType: ConceptType,
  workspaceId?: string
): Promise<KnowledgeConcept[]> {
  const supabase = await createClient()

  let query = supabase
    .from('knowledge_concepts')
    .select('*')
    .eq('team_id', teamId)
    .eq('concept_type', conceptType)
    .order('mention_count', { ascending: false })

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data.map((c) => ({
    id: c.id,
    teamId: c.team_id,
    workspaceId: c.workspace_id,
    name: c.name,
    description: c.description,
    conceptType: c.concept_type as ConceptType,
    attributes: c.attributes || {},
    aliases: c.aliases || [],
    embedding: null,
    sourceDocuments: c.source_documents || [],
    mentionCount: c.mention_count,
    firstSeenAt: c.first_seen_at,
    lastSeenAt: c.last_seen_at,
    confidenceScore: c.confidence_score,
    verified: c.verified,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }))
}
