# Architecture Rules

## Phase vs Status (CRITICAL)

| Entity | Field | Purpose |
|--------|-------|---------|
| Work Item | `phase` IS the status | research -> planning -> execution -> review -> complete |
| Timeline Item | `status` (separate) | not_started, in_progress, blocked, completed |
| Workspace | NO phase/status | Shows DISTRIBUTION of work item phases |

## Two-Layer System

```
WORKSPACE (Aggregation View)
├── mode: development | launch | growth | maintenance
├── Shows: Phase DISTRIBUTION across all work items
│
└── WORK ITEMS (Individual Phase Tracking)
    ├── phase: research | planning | execution | review | complete
    │
    └── TIMELINE ITEMS (MVP/SHORT/LONG breakdowns)
        └── status: not_started | in_progress | blocked | completed
```

## Workspace Mode

- `development`, `launch`, `growth`, `maintenance`
- Influences: default phase for new items, type weight focus, form visibility

## Strategy Hierarchy (4 Levels)

1. **Pillar** - Organization-wide theme
2. **Objective** - Team/department goal
3. **Key Result** - Measurable outcome
4. **Initiative** - Specific action

## Design Thinking = Methodology

- HOW to work at each phase (not lifecycle stages)
- Provides tools: empathy maps, prototyping, user testing
- Frameworks: Stanford d.school, Double Diamond, IDEO HCD

## Domain Terminology

| Concept | DB Table | UI Label |
|---------|----------|----------|
| Organization | `team` | "Team" |
| Product/Project | `workspace` | "Workspace" |
| Feature/Bug/etc | `work_item` | "Work Item" |
| Timeline breakdown | `timeline_item` | "Timeline" |
| Execution task | `product_task` | "Task" |
| Dependency | `linked_item` | "Dependency" |

**Never use**: `feature`, `task` (for timeline), `project`, `ticket`, `story`
