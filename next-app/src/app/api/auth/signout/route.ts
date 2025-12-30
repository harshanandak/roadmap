import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  // Sign out from Supabase
  await supabase.auth.signOut()

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url))
}

export async function POST(request: Request) {
  // Support POST as well for form submissions
  return GET(request)
}
