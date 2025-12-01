# Cross-Team Collaboration Research

**Research Date**: 2025-12-01
**Category**: Team Collaboration Patterns
**Key Finding**: 75% of cross-functional teams are dysfunctional

---

## Executive Summary

Cross-functional team collaboration is one of the most challenging aspects of product development. Research shows that 75% of cross-functional teams fail to deliver, primarily due to unclear missions, competing priorities, and lack of shared language. This document outlines the challenges and proven solutions.

---

## Why Cross-Functional Teams Fail

### HBR/Atlassian Research: Top 5 Failure Reasons

| Reason | Description | Our Solution |
|--------|-------------|--------------|
| **Fuzzy mission** | No clear goal or parameters | Strategy Foundation (Part 4) |
| **Competing priorities** | Members focus on own department | Unified work item visibility |
| **Power dynamics** | Different seniority levels create friction | Role-based permissions |
| **Lack of authority** | Can't take action without approvals | Clear ownership model |
| **No shared language** | Different terminology across departments | Unified taxonomy |

### The 75% Dysfunctional Statistic

From Harvard Business Review research:
> "75% of cross-functional teams are dysfunctional. They fail on at least three of five criteria: meeting a planned budget, staying on schedule, adhering to specifications, meeting customer expectations, and maintaining alignment with corporate goals."

---

## Successful Cross-Team Patterns

### Industry Examples

| Tool | Approach | Key Lesson |
|------|----------|------------|
| **Asana** | Portfolios for cross-team visibility | Single source of truth across teams |
| **Productboard** | Custom Roles for governance | Different permissions per role |
| **Jira + Confluence** | Unified platform | Avoid tool sprawl |
| **Linear** | Cycles across teams | Synchronized timelines |

### Productboard Custom Roles Quote

> "As Product Operations, with Custom Roles I can ensure consistency, scalability, and the integrity of the data in Productboard" - Dana McKnight, Teladoc Health

---

## Team-Specific Field Templates

### Engineering Fields
```typescript
const ENGINEERING_FIELDS = [
  { name: 'technical_domain', type: 'select',
    options: ['Frontend', 'Backend', 'Database', 'Infrastructure', 'Security', 'Performance'] },
  { name: 'complexity', type: 'select',
    options: ['Trivial', 'Low', 'Medium', 'High', 'Very High'] },
  { name: 'tech_stack', type: 'multi_select',
    options: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'] },
  { name: 'breaking_changes', type: 'boolean', defaultValue: false },
  { name: 'requires_migration', type: 'boolean', defaultValue: false },
  { name: 'security_review', type: 'select',
    options: ['Not Required', 'Pending', 'Approved', 'Rejected'] },
  { name: 'performance_impact', type: 'select',
    options: ['None', 'Positive', 'Negative - Acceptable', 'Negative - Needs Optimization'] },
]
```

### Design Fields
```typescript
const DESIGN_FIELDS = [
  { name: 'design_type', type: 'select',
    options: ['UI Design', 'UX Research', 'Prototype', 'Design System', 'Illustration', 'Branding'] },
  { name: 'design_status', type: 'select',
    options: ['Not Started', 'Research', 'Wireframes', 'Hi-Fi', 'Review', 'Approved', 'Handed Off'] },
  { name: 'accessibility_level', type: 'select',
    options: ['AA', 'AAA', 'Not Applicable'] },
  { name: 'figma_link', type: 'url' },
  { name: 'prototype_link', type: 'url' },
  { name: 'design_system_components', type: 'multi_select',
    options: ['Button', 'Form', 'Modal', 'Card', 'Table', 'New Component'] },
  { name: 'user_testing_required', type: 'boolean', defaultValue: false },
]
```

### Marketing Fields
```typescript
const MARKETING_FIELDS = [
  { name: 'campaign', type: 'text' },
  { name: 'target_audience', type: 'multi_select',
    options: ['Startup Founders', 'Enterprise PMs', 'Indie Developers', 'Design Teams'] },
  { name: 'channels', type: 'multi_select',
    options: ['Twitter', 'LinkedIn', 'Product Hunt', 'Indie Hackers', 'Email', 'Blog', 'YouTube'] },
  { name: 'messaging_angle', type: 'text' },
  { name: 'launch_date', type: 'date' },
  { name: 'content_status', type: 'select',
    options: ['Not Started', 'Drafting', 'Review', 'Approved', 'Published'] },
  { name: 'metrics_goal', type: 'text' },
]
```

### Sales Fields
```typescript
const SALES_FIELDS = [
  { name: 'positioning', type: 'text' },
  { name: 'objection_handlers', type: 'rich_text' },
  { name: 'competitive_angle', type: 'text' },
  { name: 'demo_script', type: 'rich_text' },
  { name: 'target_segment', type: 'multi_select',
    options: ['SMB', 'Mid-Market', 'Enterprise', 'Startups'] },
  { name: 'deal_enabler', type: 'boolean', defaultValue: false },
  { name: 'pricing_tier', type: 'select',
    options: ['Free', 'Pro', 'Enterprise', 'All Tiers'] },
]
```

### Support Fields
```typescript
const SUPPORT_FIELDS = [
  { name: 'documentation_status', type: 'select',
    options: ['Not Needed', 'Not Started', 'In Progress', 'Review', 'Published'] },
  { name: 'training_required', type: 'boolean', defaultValue: false },
  { name: 'known_issues', type: 'rich_text' },
  { name: 'faq_entries', type: 'rich_text' },
  { name: 'support_article_link', type: 'url' },
  { name: 'customer_communication', type: 'select',
    options: ['None', 'Changelog', 'Email', 'In-App', 'All'] },
]
```

---

## Cross-Team Connection Types

### Connection Matrix

```
FEATURE (Product/Engineering)
    ↓
    │ enables
    │
┌───┴──────────────────────────────────────────────┐
│                                                   │
▼           ▼              ▼              ▼         │
DESIGN      MARKETING     SALES          SUPPORT   │
WORK        CAMPAIGN      ENABLEMENT     DOCS      │
(design_for) (marketing_for) (enables)   (docs_for)│
```

### Connection Type Definitions

| Type | Description | Use Case |
|------|-------------|----------|
| `blocks` | Source blocks target from starting | Engineering blocker |
| `blocked_by` | Source is blocked by target | Waiting on dependency |
| `relates_to` | General relationship | Related work items |
| `depends_on` | Source needs target complete | Sequential dependency |
| `enables` | Source enables target to proceed | Feature unlocks capability |
| `duplicates` | Source is duplicate of target | Deduplication |
| `parent_of` | Hierarchical parent | Epic → Stories |
| `child_of` | Hierarchical child | Story → Epic |
| `marketing_for` | Marketing work for feature | Campaign for feature |
| `documentation_for` | Docs for feature | Support docs |
| `design_for` | Design work for feature | UI/UX design |
| `qa_for` | QA work for feature | Testing |

---

## Team Views of Same Data

### Engineering View (Board)
```
┌─────────────────────────────────────────────────────────────┐
│  Engineering Board                           [+ Add Task]   │
├─────────────────────────────────────────────────────────────┤
│  TODO          IN PROGRESS      IN REVIEW       DONE        │
│  ┌─────────┐   ┌─────────┐     ┌─────────┐    ┌─────────┐   │
│  │OAuth    │   │Database │     │Auth     │    │Login    │   │
│  │Setup    │   │Schema   │     │Tests    │    │UI       │   │
│  │[M] Auth │   │[L] DB   │     │[S] Auth │    │[M] FE   │   │
│  │@alice   │   │@bob     │     │@carol   │    │@dave    │   │
│  └─────────┘   └─────────┘     └─────────┘    └─────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Marketing View (Campaign Timeline)
```
┌─────────────────────────────────────────────────────────────┐
│  Marketing Campaigns                    [+ Add Campaign]    │
├─────────────────────────────────────────────────────────────┤
│  Dec 2025                          Jan 2026                 │
│  ├─────────────────────────────────┼────────────────────────│
│  │  ████ OAuth Launch Campaign     │                        │
│  │       (Dec 15-22)               │                        │
│  │       → Links to: OAuth Feature │                        │
└─────────────────────────────────────────────────────────────┘
```

### Support View (Documentation Status)
```
┌─────────────────────────────────────────────────────────────┐
│  Documentation Tracker                    [+ Add Doc]       │
├─────────────────────────────────────────────────────────────┤
│  Needs Documentation (Shipping Soon):                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ⚠️ OAuth Login (Ships Dec 15)                         │  │
│  │    Status: Not Started                                │  │
│  │    Required: Setup Guide, FAQ, Troubleshooting        │  │
│  │    [Start Documentation]                              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Unified Alignment Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  OAuth Login Feature                                    [All Teams] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CROSS-TEAM STATUS                                                  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Team          Status              Progress    Blocker?             │
│  ────────────  ──────────────────  ─────────  ─────────             │
│  🔧 Engineering  In Development     ████████░░ 80%     ✅            │
│  🎨 Design       Handed Off         ██████████ 100%    ✅            │
│  📢 Marketing    Drafting Content   ██████░░░░ 60%     ✅            │
│  💼 Sales        Preparing Demo     ████░░░░░░ 40%     ⚠️ Needs script│
│  📚 Support      Not Started        ░░░░░░░░░░ 0%      ⚠️ Blocked    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Team Configurations Table

```sql
CREATE TABLE team_configurations (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),

  department TEXT NOT NULL CHECK (department IN (
    'product', 'engineering', 'design', 'marketing',
    'sales', 'support', 'leadership', 'custom'
  )),

  custom_fields JSONB DEFAULT '[]',
  categories JSONB DEFAULT '[]',
  default_view TEXT DEFAULT 'list',
  default_filters JSONB DEFAULT '{}',

  UNIQUE(workspace_id, department)
);
```

### Work Item Team Contexts Table

```sql
CREATE TABLE work_item_team_contexts (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  work_item_id TEXT NOT NULL REFERENCES work_items(id),
  department TEXT NOT NULL,

  field_values JSONB DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  team_status TEXT,
  notes TEXT,
  deliverables JSONB DEFAULT '[]',

  UNIQUE(work_item_id, department)
);
```

### Work Item Connections Table

```sql
CREATE TABLE work_item_connections (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),

  source_work_item_id TEXT NOT NULL REFERENCES work_items(id),
  target_work_item_id TEXT NOT NULL REFERENCES work_items(id),

  connection_type TEXT NOT NULL,
  notes TEXT,
  is_bidirectional BOOLEAN DEFAULT false,

  UNIQUE(source_work_item_id, target_work_item_id, connection_type)
);
```

---

## Implementation Recommendations

### Phase 1: Team Configuration
1. Create team_configurations table
2. Build team setup wizard
3. Create preset templates per department
4. Add team context to work item detail

### Phase 2: Custom Fields
1. Custom field builder UI
2. Field type implementations
3. Team-specific field visibility
4. Field values storage

### Phase 3: Connections
1. Create work_item_connections table
2. Connection creation UI
3. Cross-team dependency visualization
4. Auto-suggest connections

---

## Related Research

- [Progressive Disclosure UX](progressive-disclosure-ux.md) - Role-based views
- [Flexibility vs Simplicity](flexibility-vs-simplicity.md) - Configuration balance
- [Dashboard Design](dashboard-design.md) - Team-specific dashboards

---

## Sources

- Harvard Business Review: Cross-Functional Team Research
- Atlassian: Team Collaboration Studies
- Productboard: Custom Roles Documentation
- Asana: Portfolio Management
