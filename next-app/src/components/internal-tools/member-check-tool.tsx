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

interface ResultSectionProps {
  children: React.ReactNode
  title: string
}

function ResultSection({ children, title }: Readonly<ResultSectionProps>) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function DetailItem({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <p>
      <strong>{label}:</strong> {value}
    </p>
  )
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
                <DetailItem label="Email" value={result.email} />
                <DetailItem label="Team ID" value={result.teamId} />
                <DetailItem label="Your Role" value={result.currentUserRole} />
              </div>

              <ResultSection title={`Invitations (${result.invitations?.length || 0})`}>
                {result.invitations && result.invitations.length > 0 ? (
                  <div className="space-y-2">
                    {result.invitations.map((inv) => (
                      <div
                        key={`${inv.created_at}-${inv.expires_at}-${inv.role}`}
                        className="rounded border bg-white p-3"
                      >
                        <DetailItem
                          label="Status"
                          value={inv.accepted_at ? 'Accepted' : 'Pending'}
                        />
                        <DetailItem label="Role" value={inv.role} />
                        <DetailItem
                          label="Created"
                          value={new Date(inv.created_at).toLocaleString()}
                        />
                        {inv.accepted_at && (
                          <DetailItem
                            label="Accepted"
                            value={new Date(inv.accepted_at).toLocaleString()}
                          />
                        )}
                        <DetailItem
                          label="Expires"
                          value={new Date(inv.expires_at).toLocaleString()}
                        />
                        <p
                          className={
                            inv.expires_at > new Date().toISOString()
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {inv.expires_at > new Date().toISOString() ? 'Valid' : 'Expired'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No invitations found</p>
                )}
              </ResultSection>

              <ResultSection title={`User Account (${result.existingUsers?.length || 0})`}>
                {result.existingUsers && result.existingUsers.length > 0 ? (
                  <div className="space-y-2">
                    {result.existingUsers.map((user) => (
                      <div key={user.id} className="rounded border bg-white p-3">
                        <DetailItem label="User ID" value={user.id} />
                        <DetailItem label="Email" value={user.email} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No user account found</p>
                )}
              </ResultSection>

              <ResultSection title="Team Member Status">
                {result.memberWithEmail ? (
                  <div className="rounded border border-green-200 bg-green-50 p-3">
                    <p className="mb-2 font-semibold text-green-800">Member Found in Team</p>
                    <DetailItem label="Member ID" value={result.memberWithEmail.id} />
                    <DetailItem label="User ID" value={result.memberWithEmail.user_id} />
                    <DetailItem label="Role" value={result.memberWithEmail.role} />
                    <DetailItem
                      label="Joined"
                      value={new Date(result.memberWithEmail.joined_at).toLocaleString()}
                    />
                    {result.memberWithEmail.users && (
                      <>
                        <DetailItem
                          label="Name"
                          value={result.memberWithEmail.users.name || 'N/A'}
                        />
                        <DetailItem label="Email" value={result.memberWithEmail.users.email} />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
                    <p className="font-semibold text-yellow-800">Member not found in team</p>
                    <p className="mt-2 text-sm">This user is not currently listed as a team member.</p>
                  </div>
                )}
              </ResultSection>

              <ResultSection title={`All Team Members (${result.teamMembers?.length || 0})`}>
                {result.teamMembers && result.teamMembers.length > 0 ? (
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                    {result.teamMembers.map((member) => (
                      <div key={member.id} className="rounded border bg-white p-2 text-sm">
                        <p>
                          <strong>{member.users?.email || 'Unknown'}</strong> ({member.role})
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No team members found</p>
                )}
              </ResultSection>

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
