'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TeamGeneralSettings } from '@/components/team/settings/team-general-settings'
import { TeamBillingSettings } from '@/components/team/settings/team-billing-settings'
import { TeamIntegrationsSettings } from '@/components/team/settings/team-integrations-settings'
import { useActiveTeam } from '@/lib/teams/use-active-team'

interface Team {
  id: string
  name: string
  plan: string
  created_at: string
}

export default function TeamSettingsPage() {
  const supabase = createClient()
  const {
    activeMembership,
    activeTeamId: teamId,
    error: activeTeamError,
    isLoading: loadingActiveTeam,
  } = useActiveTeam()
  const currentUserRole = activeMembership?.role || 'member'

  // Fetch team details
  const {
    data: team,
    isLoading: loadingTeam,
    error: teamError,
  } = useQuery({
    queryKey: ['team-details', teamId],
    queryFn: async () => {
      if (!teamId) return null
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (error) throw error
      return data as Team
    },
    enabled: !!teamId,
  })

  if (loadingActiveTeam || loadingTeam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (activeTeamError) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="text-center py-12">
          <p className="text-red-600">Failed to resolve your organization context</p>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTeamError instanceof Error ? activeTeamError.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  if (!teamId) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="text-center py-12 text-muted-foreground">
          <p>No active organization found</p>
          <p className="text-sm mt-1">Join or create an organization to manage settings.</p>
        </div>
      </div>
    )
  }

  if (teamError || !team) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load team settings</p>
          <p className="text-sm text-muted-foreground mt-1">
            {teamError instanceof Error ? teamError.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization&apos;s configuration and subscription
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <TeamGeneralSettings team={team} currentUserRole={currentUserRole} />
        </TabsContent>

        <TabsContent value="billing">
          <TeamBillingSettings team={team} />
        </TabsContent>

        <TabsContent value="integrations">
          <TeamIntegrationsSettings team={team} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
