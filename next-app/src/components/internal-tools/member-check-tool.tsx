'use client'

import { useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InvitationRecord {
  accepted_at: string | null
  role: string
  created_at: string
  expires_at: string
}

interface UserRecord {
  id: string
  email: string
}

interface TeamMemberRecord {
  id: string
  user_id: string
  role: string
  joined_at: string
  users?: {
    name: string | null
    email: string
  }
}

interface MemberCheckResult {
  email: string
  teamId: string
  currentUserRole: string
  invitations?: InvitationRecord[]
  existingUsers?: UserRecord[]
  memberWithEmail?: TeamMemberRecord
  teamMembers?: TeamMemberRecord[]
  errors?: Record<string, unknown>
}

export function MemberCheckTool() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MemberCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkMemberStatus = async () => {
    if (!email) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/debug/member-status?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to check member status')
        return
      }

      setResult(data as MemberCheckResult)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to check member status'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Internal Tool: Team Member Status Checker</CardTitle>
          <CardDescription>
            Read-only internal inspection tool for invitations and team membership state.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            This tool is for internal debugging only. It should not be used as the primary source
            of truth for membership repair.
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={checkMemberStatus} disabled={loading || !email}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold">Search Details</h3>
                <p><strong>Email:</strong> {result.email}</p>
                <p><strong>Team ID:</strong> {result.teamId}</p>
                <p><strong>Your Role:</strong> {result.currentUserRole}</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold">
                  Invitations ({result.invitations?.length || 0})
                </h3>
                {result.invitations && result.invitations.length > 0 ? (
                  <div className="space-y-2">
                    {result.invitations.map((inv, idx) => (
                      <div key={idx} className="rounded border bg-white p-3">
                        <p><strong>Status:</strong> {inv.accepted_at ? 'Accepted' : 'Pending'}</p>
                        <p><strong>Role:</strong> {inv.role}</p>
                        <p><strong>Created:</strong> {new Date(inv.created_at).toLocaleString()}</p>
                        {inv.accepted_at && (
                          <p><strong>Accepted:</strong> {new Date(inv.accepted_at).toLocaleString()}</p>
                        )}
                        <p><strong>Expires:</strong> {new Date(inv.expires_at).toLocaleString()}</p>
                        <p className={inv.expires_at > new Date().toISOString() ? 'text-green-600' : 'text-red-600'}>
                          {inv.expires_at > new Date().toISOString() ? 'Valid' : 'Expired'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No invitations found</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold">
                  User Account ({result.existingUsers?.length || 0})
                </h3>
                {result.existingUsers && result.existingUsers.length > 0 ? (
                  <div className="space-y-2">
                    {result.existingUsers.map((user, idx) => (
                      <div key={idx} className="rounded border bg-white p-3">
                        <p><strong>User ID:</strong> {user.id}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No user account found</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold">Team Member Status</h3>
                {result.memberWithEmail ? (
                  <div className="rounded border border-green-200 bg-green-50 p-3">
                    <p className="mb-2 font-semibold text-green-800">Member Found in Team</p>
                    <p><strong>Member ID:</strong> {result.memberWithEmail.id}</p>
                    <p><strong>User ID:</strong> {result.memberWithEmail.user_id}</p>
                    <p><strong>Role:</strong> {result.memberWithEmail.role}</p>
                    <p><strong>Joined:</strong> {new Date(result.memberWithEmail.joined_at).toLocaleString()}</p>
                    {result.memberWithEmail.users && (
                      <>
                        <p><strong>Name:</strong> {result.memberWithEmail.users.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {result.memberWithEmail.users.email}</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
                    <p className="font-semibold text-yellow-800">Member not found in team</p>
                    <p className="mt-2 text-sm">This user is not currently listed as a team member.</p>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold">
                  All Team Members ({result.teamMembers?.length || 0})
                </h3>
                {result.teamMembers && result.teamMembers.length > 0 ? (
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                    {result.teamMembers.map((member, idx) => (
                      <div key={idx} className="rounded border bg-white p-2 text-sm">
                        <p>
                          <strong>{member.users?.email || 'Unknown'}</strong> ({member.role})
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No team members found</p>
                )}
              </div>

              {result.errors && Object.values(result.errors).some(Boolean) && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h3 className="mb-2 font-semibold text-red-800">Database Errors</h3>
                  <pre className="overflow-x-auto text-xs">{JSON.stringify(result.errors, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
