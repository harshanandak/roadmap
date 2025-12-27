/**
 * Document Processor
 *
 * Handles document upload, text extraction, chunking, and embedding.
 * Supports PDF, DOCX, MD, TXT, HTML, CSV, JSON.
 *
 * Processing Pipeline:
 * 1. Upload file to Supabase Storage
 * 2. Extract text content
 * 3. Chunk text into segments
 * 4. Generate embeddings
 * 5. Store chunks with embeddings in database
 */

import { createClient } from '@/lib/supabase/server'
import { chunkText, generateEmbeddings, formatEmbeddingForPgvector } from './embedding-service'
import DOMPurify from 'isomorphic-dompurify'
import type {
  DocumentFileType,
  DocumentStatus,
} from '@/lib/types/knowledge'

// =============================================================================
// TYPES
// =============================================================================

export interface ProcessDocumentOptions {
  documentId: string
  teamId: string
  workspaceId?: string
  onProgress?: (status: DocumentStatus, progress: number, message: string) => void
}

export interface ProcessingResult {
  success: boolean
  documentId: string
  chunkCount: number
  wordCount: number
  error?: string
}

// =============================================================================
// TEXT EXTRACTION
// =============================================================================

/**
 * Extract text from various file types
 */
export async function extractText(
  fileContent: ArrayBuffer,
  fileType: DocumentFileType,
  _fileName: string
): Promise<string> {
  switch (fileType) {
    case 'txt':
    case 'md':
    case 'html':
      return new TextDecoder().decode(fileContent)

    case 'json':
      const jsonText = new TextDecoder().decode(fileContent)
      try {
        const parsed = JSON.parse(jsonText)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return jsonText
      }

    case 'csv':
      return new TextDecoder().decode(fileContent)

    case 'pdf':
      // For PDF extraction, we'd use a library like pdf-parse
      // For now, return placeholder - actual implementation would use server-side processing
      throw new Error('PDF extraction requires server-side processing. Use /api/documents/process endpoint.')

    case 'docx':
    case 'doc':
      // For DOCX extraction, we'd use mammoth or docx library
      throw new Error('DOCX extraction requires server-side processing. Use /api/documents/process endpoint.')

    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

/**
 * Extract text from HTML content
 * Uses DOMPurify for secure sanitization to prevent XSS and script injection
 */
export function extractTextFromHtml(html: string): string {
  // Use DOMPurify for secure HTML sanitization - removes all tags
  const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
  // Clean up whitespace and decode common entities
  return sanitized
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract text from Markdown
 */
export function extractTextFromMarkdown(markdown: string): string {
  // Keep the markdown structure for better chunking
  return markdown
    .replace(/```[\s\S]*?```/g, (match) => match) // Keep code blocks
    .replace(/`[^`]+`/g, (match) => match) // Keep inline code
    .trim()
}

// =============================================================================
// DOCUMENT PROCESSING
// =============================================================================

/**
 * Process a document: extract, chunk, embed, and store
 */
export async function processDocument(
  options: ProcessDocumentOptions
): Promise<ProcessingResult> {
  const { documentId, onProgress } = options

  const supabase = await createClient()

  try {
    // Update status to processing
    onProgress?.('processing', 0, 'Starting document processing...')

    await supabase
      .from('knowledge_documents')
      .update({ status: 'processing' })
      .eq('id', documentId)

    // Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      throw new Error('Document not found')
    }

    onProgress?.('processing', 10, 'Fetching document content...')

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge-documents')
      .download(document.file_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`)
    }

    onProgress?.('processing', 20, 'Extracting text...')

    // Extract text based on file type
    let extractedText: string

    if (['txt', 'md', 'json', 'csv'].includes(document.file_type)) {
      extractedText = await extractText(
        await fileData.arrayBuffer(),
        document.file_type as DocumentFileType,
        document.name
      )
    } else {
      // For PDF/DOCX, we need server-side processing
      // This would call an external service or use a serverless function
      throw new Error(`File type ${document.file_type} requires advanced extraction`)
    }

    // Clean up HTML if needed
    if (document.file_type === 'html') {
      extractedText = extractTextFromHtml(extractedText)
    }

    onProgress?.('processing', 40, 'Chunking text...')

    // Chunk the text
    const chunks = chunkText(extractedText)

    if (chunks.length === 0) {
      throw new Error('No text content could be extracted from document')
    }

    onProgress?.('processing', 50, `Generating embeddings for ${chunks.length} chunks...`)

    // Generate embeddings
    const embeddingResult = await generateEmbeddings(chunks)

    onProgress?.('processing', 80, 'Storing chunks in database...')

    // Delete existing chunks (for re-processing)
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId)

    // Store chunks with embeddings
    const chunkInserts = chunks.map((chunk) => {
      const embeddingData = embeddingResult.chunks.find((e) => e.index === chunk.index)

      return {
        id: `${documentId}-${chunk.index}`,
        document_id: documentId,
        chunk_index: chunk.index,
        content: chunk.content,
        token_count: embeddingData?.tokenCount || Math.ceil(chunk.content.length / 4),
        heading: chunk.heading,
        metadata: chunk.metadata,
        // Format embedding for pgvector
        embedding: embeddingData
          ? formatEmbeddingForPgvector(embeddingData.embedding)
          : null,
      }
    })

    // Insert in batches of 100
    const batchSize = 100
    for (let i = 0; i < chunkInserts.length; i += batchSize) {
      const batch = chunkInserts.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert(batch)

      if (insertError) {
        console.error('Chunk insert error:', insertError)
        throw new Error(`Failed to store chunks: ${insertError.message}`)
      }
    }

    onProgress?.('processing', 95, 'Finalizing...')

    // Calculate word count
    const wordCount = extractedText.split(/\s+/).filter((w) => w.length > 0).length

    // Update document status
    const { error: updateError } = await supabase
      .from('knowledge_documents')
      .update({
        status: 'ready',
        extracted_text: extractedText,
        extracted_at: new Date().toISOString(),
        chunk_count: chunks.length,
        word_count: wordCount,
        embedding_model: embeddingResult.model,
        embedding_dimensions: embeddingResult.dimensions,
        last_embedded_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq('id', documentId)

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`)
    }

    onProgress?.('ready', 100, 'Document processed successfully!')

    return {
      success: true,
      documentId,
      chunkCount: chunks.length,
      wordCount,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Update document with error
    await supabase
      .from('knowledge_documents')
      .update({
        status: 'error',
        processing_error: errorMessage,
      })
      .eq('id', documentId)

    onProgress?.('error', 0, errorMessage)

    return {
      success: false,
      documentId,
      chunkCount: 0,
      wordCount: 0,
      error: errorMessage,
    }
  }
}

// =============================================================================
// SEARCH
// =============================================================================

/**
 * Search documents using vector similarity
 */
export async function searchDocuments(options: {
  teamId: string
  query: string
  queryEmbedding: number[]
  workspaceId?: string
  collectionId?: string
  limit?: number
  threshold?: number
}): Promise<Array<{
  chunkId: string
  documentId: string
  documentName: string
  content: string
  similarity: number
  pageNumber?: number
  heading?: string
}>> {
  const {
    teamId,
    queryEmbedding,
    workspaceId,
    collectionId,
    limit = 10,
    threshold = 0.7,
  } = options

  const supabase = await createClient()

  // Use the search_documents function
  const { data, error } = await supabase.rpc('search_documents', {
    p_team_id: teamId,
    p_query_embedding: formatEmbeddingForPgvector(queryEmbedding),
    p_workspace_id: workspaceId || null,
    p_collection_id: collectionId || null,
    p_limit: limit,
    p_threshold: threshold,
  })

  if (error) {
    console.error('Search error:', error)
    throw new Error(`Search failed: ${error.message}`)
  }

  return (data || []).map((row: {
    chunk_id: string
    document_id: string
    document_name: string
    content: string
    similarity: number
    page_number?: number
    heading?: string
  }) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    documentName: row.document_name,
    content: row.content,
    similarity: row.similarity,
    pageNumber: row.page_number,
    heading: row.heading,
  }))
}
