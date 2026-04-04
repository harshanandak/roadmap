'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { User } from '@supabase/supabase-js'

interface InvitationData {
  email: string
  role: string
  team_name: string
  team_plan: string
  inviter_name: string | null
  inviter_email: string
  expires_at: string
  is_expired: boolean
}

export default function AcceptInvitePage() {
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    void loadInvitation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const loadInvitation = async () => {
    try {
      const response = await fetch(`/api/team/invitations/details?token=${encodeURIComponent(token || '')}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invitation not found or already accepted')
        setLoading(false)
        return
      }

      if (data.is_expired) {
        setError('This invitation has expired')
        setLoading(false)
        return
      }

      setInvitation(data as InvitationData)
      setLoading(false)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user && user.email?.toLowerCase() === data.email?.toLowerCase()) {
        await acceptInvitation(user)
      }
    } catch (err: unknown) {
      console.error('Error loading invitation:', err)
      const message = err instanceof Error ? err.message : 'Failed to load invitation'
      setError(message)
      setLoading(false)
    }
  }

  const acceptInvitation = async (_user: User) => {
    setAccepting(true)

    try {
      const response = await fetch('/api/team/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to accept invitation')
      }

      router.push(payload.data?.redirect_url || '/dashboard')
    } catch (err: unknown) {
      console.error('Error accepting invitation:', err)
      const message = err instanceof Error ? err.message : 'Failed to accept invitation'
      setError(message)
      setAccepting(false)
    }
  }

  const handleAccept = async () => {
    if (!invitation) {
      setError('Invitation not found')
      return
    }

    setAccepting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const returnUrl = encodeURIComponent(`/accept-invite?token=${token}`)
        router.push(`/signup?returnTo=${returnUrl}`)
        return
      }

      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        setError(
          `This invitation was sent to ${invitation.email}. Please sign in with that email address.`
        )
        setAccepting(false)
        return
      }

      await acceptInvitation(user)
    } catch (err: unknown) {
      console.error('Error in handleAccept:', err)
      const message = err instanceof Error ? err.message : 'Failed to accept invitation'
      setError(message)
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error || 'Invitation not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 text-5xl">Invitation</div>
          <CardTitle className="text-2xl">You&apos;re Invited</CardTitle>
          <CardDescription>
            Join <span className="font-medium">{invitation.team_name}</span> on Product Lifecycle Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Team</span>
                <span className="font-semibold">{invitation.team_name}</span>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Role</span>
                <span className="font-semibold capitalize">{invitation.role}</span>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="font-semibold capitalize">{invitation.team_plan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Invited By</span>
                <span className="font-semibold">
                  {invitation.inviter_name || invitation.inviter_email || 'Team admin'}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <p className="mb-1 font-medium">What happens next?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Accept the invitation to join the team.</li>
                <li>Access the workspaces available to your role.</li>
                <li>Start collaborating with the rest of the team.</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full"
            size="lg"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Expires on {new Date(invitation.expires_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
