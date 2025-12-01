'use client';

import { WorkBoardShell } from '@/components/work-board';

// =============================================================================
// DUMMY DATA FOR TESTING - Remove this section when done testing
// =============================================================================
const DUMMY_WORK_ITEMS = [
  {
    id: 'dummy-wi-1',
    name: 'User Authentication System',
    type: 'feature',
    status: 'in_progress',
    priority: 'high',
    owner: null,
    created_at: '2025-01-15T10:00:00Z',
    purpose: 'Allow users to securely sign in and manage their accounts',
    tags: ['auth', 'security'],
  },
  {
    id: 'dummy-wi-2',
    name: 'Dashboard Analytics Widget',
    type: 'feature',
    status: 'planned',
    priority: 'medium',
    owner: null,
    created_at: '2025-01-14T09:00:00Z',
    purpose: 'Display key metrics and KPIs on the dashboard',
    tags: ['analytics', 'ui'],
  },
  {
    id: 'dummy-wi-3',
    name: 'Fix Login Button Alignment',
    type: 'bug',
    status: 'completed',
    priority: 'low',
    owner: null,
    created_at: '2025-01-13T14:00:00Z',
    purpose: 'Button was misaligned on mobile devices',
    tags: ['bug', 'mobile'],
  },
  {
    id: 'dummy-wi-4',
    name: 'API Rate Limiting',
    type: 'enhancement',
    status: 'on_hold',
    priority: 'critical',
    owner: null,
    created_at: '2025-01-12T11:00:00Z',
    purpose: 'Prevent abuse and ensure fair usage of API endpoints',
    tags: ['api', 'security'],
  },
  {
    id: 'dummy-wi-5',
    name: 'Dark Mode Support',
    type: 'feature',
    status: 'planned',
    priority: 'medium',
    owner: null,
    created_at: '2025-01-11T08:00:00Z',
    purpose: 'Add dark mode theme option for better accessibility',
    tags: ['ui', 'accessibility'],
  },
  {
    id: 'dummy-wi-6',
    name: 'Mobile App Notifications',
    type: 'feature',
    status: 'in_progress',
    priority: 'high',
    owner: null,
    created_at: '2025-01-10T16:00:00Z',
    purpose: 'Push notifications for mobile app users',
    tags: ['mobile', 'notifications'],
  },
  {
    id: 'dummy-wi-7',
    name: 'Performance Optimization',
    type: 'enhancement',
    status: 'planned',
    priority: 'high',
    owner: null,
    created_at: '2025-01-09T12:00:00Z',
    purpose: 'Improve page load times and reduce bundle size',
    tags: ['performance'],
  },
  {
    id: 'dummy-wi-8',
    name: 'Export to PDF Feature',
    type: 'feature',
    status: 'completed',
    priority: 'low',
    owner: null,
    created_at: '2025-01-08T10:00:00Z',
    purpose: 'Allow users to export reports as PDF documents',
    tags: ['export', 'reports'],
  },
];

const DUMMY_TIMELINE_ITEMS = [
  {
    id: 'dummy-ti-1',
    work_item_id: 'dummy-wi-1',
    title: 'OAuth2 Integration',
    description: 'Implement OAuth2 flow with JWT tokens and refresh mechanism',
    timeline: 'MVP',
    phase: 'development',
    status: 'in_progress',
  },
  {
    id: 'dummy-ti-2',
    work_item_id: 'dummy-wi-1',
    title: 'Social Login (Google, GitHub)',
    description: 'Add social login options for easier user onboarding',
    timeline: 'SHORT',
    phase: 'design',
    status: 'planned',
  },
  {
    id: 'dummy-ti-3',
    work_item_id: 'dummy-wi-2',
    title: 'Chart Components',
    description: 'Build reusable chart components using Recharts library',
    timeline: 'MVP',
    phase: 'development',
    status: 'planned',
  },
  {
    id: 'dummy-ti-4',
    work_item_id: 'dummy-wi-6',
    title: 'Firebase Push Setup',
    description: 'Configure FCM for cross-platform push notifications',
    timeline: 'MVP',
    phase: 'development',
    status: 'in_progress',
  },
  {
    id: 'dummy-ti-5',
    work_item_id: 'dummy-wi-7',
    title: 'Code Splitting',
    description: 'Research dynamic imports and lazy loading strategies',
    timeline: 'SHORT',
    phase: 'research',
    status: 'planned',
  },
];

// Dummy tasks data - mix of standalone and linked tasks
const DUMMY_TASKS = [
  // Standalone tasks (not linked to any work item)
  {
    id: 'dummy-task-1',
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    status: 'in_progress',
    task_type: 'development',
    priority: 'high',
    assigned_to: null,
    work_item_id: null,
    timeline_item_id: null,
    created_at: '2025-01-20T09:00:00Z',
    updated_at: '2025-01-20T09:00:00Z',
  },
  {
    id: 'dummy-task-2',
    title: 'Review security audit findings',
    description: 'Go through the security audit report and create action items',
    status: 'todo',
    task_type: 'qa',
    priority: 'critical',
    assigned_to: null,
    work_item_id: null,
    timeline_item_id: null,
    created_at: '2025-01-19T14:00:00Z',
    updated_at: '2025-01-19T14:00:00Z',
  },
  {
    id: 'dummy-task-3',
    title: 'Update team documentation',
    description: 'Refresh the onboarding docs with new processes',
    status: 'done',
    task_type: 'admin',
    priority: 'low',
    assigned_to: null,
    work_item_id: null,
    timeline_item_id: null,
    created_at: '2025-01-18T10:00:00Z',
    updated_at: '2025-01-19T16:00:00Z',
  },
  // Tasks linked to work items
  {
    id: 'dummy-task-4',
    title: 'Implement JWT token refresh',
    description: 'Add automatic token refresh mechanism for OAuth2',
    status: 'in_progress',
    task_type: 'development',
    priority: 'high',
    assigned_to: null,
    work_item_id: 'dummy-wi-1', // Linked to "User Authentication System"
    timeline_item_id: 'dummy-ti-1',
    created_at: '2025-01-15T11:00:00Z',
    updated_at: '2025-01-20T08:00:00Z',
  },
  {
    id: 'dummy-task-5',
    title: 'Design login page mockups',
    description: 'Create Figma designs for the new login flow',
    status: 'done',
    task_type: 'design',
    priority: 'medium',
    assigned_to: null,
    work_item_id: 'dummy-wi-1', // Linked to "User Authentication System"
    timeline_item_id: 'dummy-ti-2',
    created_at: '2025-01-14T09:00:00Z',
    updated_at: '2025-01-16T14:00:00Z',
  },
  {
    id: 'dummy-task-6',
    title: 'Research chart libraries',
    description: 'Evaluate Recharts vs Chart.js vs D3 for analytics widgets',
    status: 'done',
    task_type: 'research',
    priority: 'medium',
    assigned_to: null,
    work_item_id: 'dummy-wi-2', // Linked to "Dashboard Analytics Widget"
    timeline_item_id: 'dummy-ti-3',
    created_at: '2025-01-14T10:00:00Z',
    updated_at: '2025-01-15T16:00:00Z',
  },
  {
    id: 'dummy-task-7',
    title: 'Configure Firebase Cloud Messaging',
    description: 'Set up FCM for push notifications on mobile',
    status: 'todo',
    task_type: 'development',
    priority: 'high',
    assigned_to: null,
    work_item_id: 'dummy-wi-6', // Linked to "Mobile App Notifications"
    timeline_item_id: 'dummy-ti-4',
    created_at: '2025-01-10T17:00:00Z',
    updated_at: '2025-01-10T17:00:00Z',
  },
  {
    id: 'dummy-task-8',
    title: 'Write unit tests for auth module',
    description: 'Add Jest tests for authentication service',
    status: 'todo',
    task_type: 'qa',
    priority: 'medium',
    assigned_to: null,
    work_item_id: 'dummy-wi-1', // Linked to "User Authentication System"
    timeline_item_id: null,
    created_at: '2025-01-17T11:00:00Z',
    updated_at: '2025-01-17T11:00:00Z',
  },
  // More standalone tasks
  {
    id: 'dummy-task-9',
    title: 'Weekly team standup notes',
    description: 'Document action items from Monday standup',
    status: 'done',
    task_type: 'admin',
    priority: 'low',
    assigned_to: null,
    work_item_id: null,
    timeline_item_id: null,
    created_at: '2025-01-20T10:00:00Z',
    updated_at: '2025-01-20T11:00:00Z',
  },
  {
    id: 'dummy-task-10',
    title: 'Prepare product demo',
    description: 'Create demo script and test environment for stakeholder presentation',
    status: 'in_progress',
    task_type: 'marketing',
    priority: 'high',
    assigned_to: null,
    work_item_id: null,
    timeline_item_id: null,
    created_at: '2025-01-19T09:00:00Z',
    updated_at: '2025-01-20T14:00:00Z',
  },
];

// Flag to enable/disable dummy data - set to false when testing is done
const USE_DUMMY_DATA = false;
// =============================================================================

interface WorkItemsViewProps {
  workspace: {
    id: string;
    team_id: string;
    name: string;
    [key: string]: unknown;
  };
  team: {
    id: string;
    name: string;
    [key: string]: unknown;
  };
  workItems: Array<{
    id: string;
    name: string;
    type: string;
    status: string | null;
    priority: string | null;
    owner: string | null;
    created_at: string | null;
    [key: string]: unknown;
  }>;
  timelineItems: Array<{
    id: string;
    work_item_id: string;
    title: string;
    description: string | null;
    timeline: string;
    phase: string | null;
    status: string | null;
    [key: string]: unknown;
  }>;
  linkedItems: unknown[];
  tags: unknown[];
  currentUserId: string;
  userEmail?: string;
  userName?: string;
}

export function WorkItemsView({
  workspace,
  team,
  workItems,
  timelineItems,
  currentUserId,
  userEmail,
  userName,
}: WorkItemsViewProps) {
  // Merge dummy data with real data for testing
  const allWorkItems = USE_DUMMY_DATA
    ? [...DUMMY_WORK_ITEMS, ...workItems]
    : workItems;

  const allTimelineItems = USE_DUMMY_DATA
    ? [...DUMMY_TIMELINE_ITEMS, ...timelineItems]
    : timelineItems;

  const allDummyTasks = USE_DUMMY_DATA ? DUMMY_TASKS : [];

  return (
    <WorkBoardShell
      workspace={{
        id: workspace.id,
        team_id: workspace.team_id,
        name: workspace.name,
      }}
      workItems={allWorkItems}
      timelineItems={allTimelineItems}
      currentUserId={currentUserId}
      dummyTasks={allDummyTasks}
      userEmail={userEmail}
      userName={userName}
    />
  );
}
