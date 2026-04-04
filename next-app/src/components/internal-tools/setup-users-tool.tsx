'use client'

import { useState } from 'react'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SetupUsersTool() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setupUsersTable = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/setup-users-table', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to setup users table')
        return
      }

      setResult(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to setup users table'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Internal Tool: Setup Public Users Table</CardTitle>
          <CardDescription>
            Legacy internal repair tool for environments missing the mirrored `public.users` table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Use this only for controlled recovery work. Canonical schema changes must still go
            through root-level Supabase migrations and platform scripts.
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold">What this does</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Creates `public.users` linked to `auth.users`</li>
              <li>Adds profile fields used by team/member UI</li>
              <li>Sets up RLS policies and signup trigger</li>
              <li>Backfills existing `auth.users` rows into `public.users`</li>
            </ul>
          </div>

          <Button onClick={setupUsersTable} disabled={loading} size="lg" className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Setting up users table...
              </>
            ) : (
              'Run Internal Setup'
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {result?.success && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Success</p>
                <p className="text-sm text-green-700">{result.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
