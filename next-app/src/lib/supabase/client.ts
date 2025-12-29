import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient, Subscription } from '@supabase/supabase-js'

/**
 * Singleton Supabase client for client-side (browser) usage
 *
 * Why singleton?
 * - Prevents multiple WebSocket connections per page
 * - Ensures realtime subscriptions share one connection pool
 * - Reduces memory overhead from duplicate clients
 * - Required for subscription deduplication to work correctly
 *
 * This client automatically handles cookies and auth state.
 */
let browserClient: SupabaseClient | null = null
let authSubscription: Subscription | null = null

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side: Always create a new client (SSR safety)
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // Client-side: Return singleton instance
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Auto-reset singleton on signout to prevent session bleed between users
    // Note: Defer cleanup to avoid deadlock - unsubscribe() cannot be called
    // synchronously from within the callback as it tries to acquire the same lock
    const { data } = browserClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setTimeout(() => cleanupClient(), 0)
      }
    })
    authSubscription = data.subscription
  }

  return browserClient
}

/**
 * Clean up the singleton client and its subscriptions
 * Called internally when user signs out
 */
function cleanupClient(): void {
  if (authSubscription) {
    authSubscription.unsubscribe()
    authSubscription = null
  }
  browserClient = null
}

/**
 * Reset the singleton client (useful for testing or logout)
 * Call this when user logs out to ensure a fresh client on next login
 */
export function resetClient(): void {
  cleanupClient()
}
