import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnTo = requestUrl.searchParams.get('returnTo')

  try {
    if (code) {
      const supabase = await createClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('[Auth Callback] Failed to exchange code for session:', exchangeError)
        return NextResponse.redirect(
          new URL(`/login?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`, request.url)
        )
      }
    }

    // Check if user has completed onboarding (has a team)
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('[Auth Callback] Failed to get user:', userError)
      return NextResponse.redirect(new URL('/login?error=session_invalid', request.url))
    }

    if (user) {
      // If there's a returnTo parameter, redirect there (e.g., from invitation acceptance)
      if (returnTo) {
        return NextResponse.redirect(new URL(returnTo, request.url))
      }

      // Check if user exists in users table and has a team
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 is "not found" - that's expected for new users
        console.error('[Auth Callback] Error checking user profile:', profileError)
        // Don't fail the flow, just send to onboarding
      }

      if (!userProfile) {
        // User needs to complete onboarding
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // Check if user is a member of any team
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (teamError) {
        console.error('[Auth Callback] Error checking team membership:', teamError)
        // If team_members table doesn't exist or query fails, send to onboarding
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      if (!teamMember) {
        // User needs to create/join a team
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // User is fully onboarded, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // No user session, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(
      new URL('/login?error=unexpected&message=An unexpected error occurred', request.url)
    )
  }
}
