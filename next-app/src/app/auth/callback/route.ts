import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { SupabaseClient, User } from '@supabase/supabase-js'

/** Result of ensuring user record exists */
type EnsureUserResult = { success: true } | { success: false; error: string }

/**
 * Ensures user record exists in public.users table.
 * Handles race condition where trigger may not have completed yet.
 */
async function ensureUserRecord(
  supabase: SupabaseClient,
  user: User
): Promise<EnsureUserResult> {
  // Check if user already exists
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  // Log unexpected errors (PGRST116 = "no rows found" is expected for new users)
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Failed to query user profile:', profileError)
  }

  // User already exists
  if (userProfile) {
    return { success: true }
  }

  // Cannot create user without email - required by users table
  if (!user.email) {
    return { success: false, error: 'missing_email' }
  }

  // Create user record (handles trigger race condition)
  const { error: upsertError } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
    }, { onConflict: 'id' })

  if (!upsertError) {
    return { success: true }
  }

  console.error('Failed to create user record:', upsertError)

  // Verify user exists (trigger may have succeeded)
  const { data: verifyUser, error: verifyError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (verifyError && verifyError.code !== 'PGRST116') {
    console.error('Failed to verify user record:', verifyError)
  }

  return verifyUser
    ? { success: true }
    : { success: false, error: 'account_setup_failed' }
}

/**
 * Checks if user has team membership (completed onboarding).
 */
async function hasTeamMembership(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: teamMember, error: teamError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  // Log unexpected errors (PGRST116 = "no rows found" is expected)
  if (teamError && teamError.code !== 'PGRST116') {
    console.error('Failed to query team membership:', teamError)
  }

  return !!teamMember
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnTo = requestUrl.searchParams.get('returnTo')

  // Exchange auth code for session
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Failed to exchange code for session:', error)
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'invalid_code')
      return NextResponse.redirect(errorUrl)
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Handle returnTo redirect (e.g., from invitation acceptance)
  if (returnTo) {
    return NextResponse.redirect(new URL(returnTo, request.url))
  }

  // Ensure user record exists in public.users
  const userResult = await ensureUserRecord(supabase, user)
  if (!userResult.success) {
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', userResult.error)
    return NextResponse.redirect(errorUrl)
  }

  // Check if user needs onboarding
  const hasTeam = await hasTeamMembership(supabase, user.id)
  if (!hasTeam) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
