'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceStatsGrid } from '@/components/workspaces/workspace-stats-grid';
import { MultiPhaseProgressBar } from '@/components/workspaces/multi-phase-progress-bar';
import { ActivityFeed } from '@/components/workspaces/activity-feed';
import { ContextualOnboarding } from './contextual-onboarding';
import { ModeAwareDashboard } from '@/components/dashboard/mode-aware-dashboard';
import { type WorkspaceMode } from '@/lib/types/workspace-mode';
import type { Team } from '@/lib/types/team';
import type { Database } from '@/lib/supabase/types';

/** Work Item type for dashboard view (normalized from DB type) */
interface WorkItem {
  id: string;
  name: string;
  type: string;
  status: string; // Derived from phase for ModeAwareDashboard compatibility
  phase: string;
  priority?: string;
  blockers?: string;
  department_id?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

/** Workspace row from the database */
type Workspace = Database['public']['Tables']['workspaces']['Row'];

/** Phase distribution for dashboard display (new 4-phase system) */
interface PhaseDistribution {
  design: { count: number; percentage: number };
  build: { count: number; percentage: number };
  refine: { count: number; percentage: number };
  launch: { count: number; percentage: number };
}

/** Onboarding state structure (contextual onboarding format) */
interface OnboardingState {
  hasWorkItems: boolean;
  hasMindMaps: boolean;
  hasTimeline: boolean;
  hasDependencies: boolean;
  teamSize: number;
  completionPercentage: number;
}

interface DashboardViewProps {
  workspace: Workspace;
  team: Team;
  workItems: WorkItem[];
  teamSize: number;
  phaseDistribution: PhaseDistribution;
  onboardingState: OnboardingState;
  /** Enable mode-aware dashboard widgets */
  useModeAwareDashboard?: boolean;
}

export function DashboardView({
  workspace,
  team: _team,
  workItems,
  teamSize,
  phaseDistribution,
  onboardingState,
  useModeAwareDashboard = true,
}: DashboardViewProps) {
  // Calculate stats - Use 'phase' field (phase IS the status for work items)
  const totalWorkItems = workItems?.length || 0;
  const completedWorkItems = workItems?.filter((item) => item.phase === 'launch' || item.phase === 'verified' || item.phase === 'validated' || item.phase === 'rejected').length || 0;
  const inProgressWorkItems = workItems?.filter((item) =>
    // Feature/Enhancement phases (not 'launch' which is complete)
    item.phase === 'design' || item.phase === 'build' || item.phase === 'refine' ||
    // Bug phases (not 'verified' which is complete)
    item.phase === 'triage' || item.phase === 'investigating' || item.phase === 'fixing' ||
    // Concept phases (not 'validated'/'rejected' which are terminal)
    item.phase === 'ideation' || item.phase === 'research'
  ).length || 0;
  const completionPercentage = totalWorkItems > 0
    ? Math.round((completedWorkItems / totalWorkItems) * 100)
    : 0;

  // Get workspace mode (defaults to 'development')
  const workspaceMode = (workspace.mode || 'development') as WorkspaceMode;

  // Use mode-aware dashboard when enabled and workspace has a mode
  if (useModeAwareDashboard && workspace.mode) {
    return (
      <div className="space-y-6">
        {/* Mode-Aware Dashboard */}
        <ModeAwareDashboard
          mode={workspaceMode}
          workspaceId={workspace.id}
          workItems={workItems || []}
          teamSize={teamSize}
          phaseDistribution={phaseDistribution}
        />

        {/* Description */}
        {workspace.description && (
          <Card>
            <CardHeader>
              <CardTitle>About this Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{workspace.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Contextual Onboarding (if applicable) */}
        {onboardingState && onboardingState.completionPercentage < 100 && (
          <ContextualOnboarding
            workspaceId={workspace.id}
            onboardingState={onboardingState}
          />
        )}
      </div>
    );
  }

  // Classic dashboard layout (fallback)
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <WorkspaceStatsGrid
        totalWorkItems={totalWorkItems}
        completedWorkItems={completedWorkItems}
        inProgressWorkItems={inProgressWorkItems}
        completionPercentage={completionPercentage}
        teamSize={teamSize}
      />

      {/* Multi-Phase Progress Bar */}
      <MultiPhaseProgressBar
        distribution={phaseDistribution}
        totalItems={totalWorkItems}
      />

      {/* Description */}
      {workspace.description && (
        <Card>
          <CardHeader>
            <CardTitle>About this Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{workspace.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout: Contextual Onboarding + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Contextual Onboarding (2/3 width) */}
        <div className="lg:col-span-2">
          <ContextualOnboarding
            workspaceId={workspace.id}
            onboardingState={onboardingState}
          />
        </div>

        {/* Right Column: Activity Feed (1/3 width) */}
        <div className="lg:col-span-1">
          <ActivityFeed workItems={workItems || []} />
        </div>
      </div>
    </div>
  );
}
