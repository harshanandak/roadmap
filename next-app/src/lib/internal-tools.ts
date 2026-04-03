import 'server-only'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function parseAllowlist(): string[] {
  return (process.env.INTERNAL_TOOLS_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export function areInternalToolsEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_INTERNAL_TOOLS === 'true'
}

export function isInternalToolsEmailAllowed(email?: string | null): boolean {
  if (!email) return false

  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  const allowlist = parseAllowlist()
  if (allowlist.length === 0) {
    return false
  }

  return allowlist.includes(email.toLowerCase())
}

export async function requireInternalToolAccess(): Promise<{ id: string; email?: string }> {
  if (!areInternalToolsEnabled()) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !isInternalToolsEmailAllowed(user.email)) {
    notFound()
  }

  return user
}

export async function validateInternalToolApiAccess(): Promise<
  | { ok: true; user: { id: string; email?: string } }
  | { ok: false; status: number; error: string }
> {
  if (!areInternalToolsEnabled()) {
    return { ok: false, status: 404, error: 'Not found' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  if (!user.email || !isInternalToolsEmailAllowed(user.email)) {
    return { ok: false, status: 404, error: 'Not found' }
  }

  return { ok: true, user }
}
