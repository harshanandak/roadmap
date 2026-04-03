import { NextRequest, NextResponse } from 'next/server';
import { searchWeb } from '@/lib/parallel/search-client';
import { createClient } from '@/lib/supabase/server';
import { apiRateLimit, createRateLimitHeaders } from '@/lib/security/rate-limit';

/**
 * POST /api/search
 *
 * Search the web using Parallel.ai
 *
 * Request body:
 * {
 *   objective?: string;
 *   searchQueries?: string[];
 *   maxResults?: number;
 *   mode?: 'one-shot' | 'agentic';
 * }
 *
 * Example usage:
 * ```ts
 * const response = await fetch('/api/search', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     objective: 'Find best practices for product roadmaps',
 *     searchQueries: ['product roadmap best practices 2025'],
 *     maxResults: 5
 *   })
 * });
 * const data = await response.json();
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const rateLimitResult = apiRateLimit(user.id)
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.message,
          code: 'RATE_LIMITED',
        },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    const body = await request.json();

    const { objective, searchQueries, maxResults = 10, mode = 'one-shot' } = body;

    // Validate required parameters
    if (!objective && (!searchQueries || searchQueries.length === 0)) {
      return NextResponse.json(
        {
          error: 'Must provide either objective or searchQueries',
          code: 'MISSING_PARAMETERS'
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (!['one-shot', 'agentic'].includes(mode)) {
      return NextResponse.json(
        {
          error: 'Invalid search mode',
          code: 'INVALID_MODE'
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (searchQueries && (!Array.isArray(searchQueries) || searchQueries.length > 5)) {
      return NextResponse.json(
        {
          error: 'searchQueries must be an array with at most 5 entries',
          code: 'INVALID_SEARCH_QUERIES'
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const safeMaxResults = Math.min(Math.max(Number(maxResults) || 10, 1), 10)

    // Perform search
    const results = await searchWeb({
      objective,
      searchQueries,
      maxResults: safeMaxResults,
      mode
    });

    return NextResponse.json({
      success: true,
      data: results
    }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('Search API Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Search failed',
        code: 'SEARCH_ERROR'
      },
      { status: 500 }
    );
  }
}
