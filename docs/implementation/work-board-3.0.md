# Work Board 3.0 - Implementation Guide

**Created**: 2025-11-26
**Status**: Planning Complete - Ready for Implementation
**Priority**: HIGH - Core UX Improvement

---

## Vision Statement

Transform the Work Board from a simple table view into a **unified command center** for managing both Work Items and Tasks with multiple visualization modes, smart filtering, and seamless context switching.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Work Board 3.0                              [+ Quick Task] [+ New Work Item]  │
├─────────────────────────────────────────────────────────────────────────┤
│  [Search...]  [All Status ▼]  [All Types ▼]  [Manage Columns]           │
│                                                                         │
│  ┌─────────────┬─────────────┐   ┌─────────┬─────────┬─────────┐       │
│  │   Tasks     │ Work Items  │   │  Table  │  Board  │ Timeline │       │
│  └─────────────┴─────────────┘   └─────────┴─────────┴─────────┘       │
│        PRIMARY TOGGLE                  VIEW MODE TOGGLE                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         CONTENT AREA                                    │
│                   (changes based on toggles)                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Hierarchy

```
Workspace
├── Work Items (features, bugs, concepts, enhancements)
│   ├── Timeline Items (MVP → SHORT → LONG breakdowns)
│   │   └── Tasks (linked to specific timeline item)
│   └── Tasks (linked to work item, no specific timeline)
└── Tasks (standalone - Quick Tasks)
```

**Key Insight**: Tasks exist at 3 levels:
1. **Standalone Tasks** - Workspace-level quick tasks (no parent)
2. **Work Item Tasks** - Linked to a feature/bug (`work_item_id` set)
3. **Timeline Tasks** - Linked to MVP/SHORT/LONG (`timeline_item_id` set)

---

## View Matrix

| Primary Tab | View Mode | Content | Grouping |
|-------------|-----------|---------|----------|
| **Tasks** | Table | All tasks (standalone + linked) | Flat list |
| **Tasks** | Board | Tasks by status columns | todo / in_progress / done |
| **Tasks** | Timeline | Tasks with due dates | By due date |
| **Work Items** | Table | Work items with expandable timelines | Current behavior |
| **Work Items** | Board | Work items by status | planned / in_progress / completed / on_hold |
| **Work Items** | Timeline | Gantt view | By MVP/SHORT/LONG |

---

## Component Architecture

### New Components to Create

```
src/components/work-board/
├── work-board-shell.tsx        # Main container with tabs
├── work-board-toolbar.tsx      # Unified filter bar
├── work-board-tabs.tsx         # Tasks | Work Items toggle
├── view-mode-toggle.tsx        # Table | Board | Timeline toggle
│
├── tasks-view/
│   ├── tasks-table-view.tsx    # Table view for tasks
│   ├── tasks-board-view.tsx    # Kanban board for tasks
│   └── tasks-timeline-view.tsx # Timeline view for tasks
│
├── work-items-view/
│   ├── work-items-table-view.tsx   # Enhanced current table
│   ├── work-items-board-view.tsx   # Kanban by work item status
│   └── work-items-timeline-view.tsx # Existing timeline
│
└── shared/
    ├── board-column.tsx        # Reusable kanban column
    ├── draggable-card.tsx      # Unified draggable card
    └── filter-context.tsx      # Shared filter state
```

### Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| BoardView | `src/components/board/board-view.tsx` | dnd-kit kanban (already built) |
| BoardCard | `src/components/board/board-card.tsx` | Draggable card (already built) |
| TaskList | `src/components/product-tasks/task-list.tsx` | Has board view (reuse logic) |
| FeaturesTableView | `src/components/features/features-table-view.tsx` | Current table (enhance) |
| TimelineView | `src/components/timeline/timeline-view.tsx` | Gantt chart (reuse) |
| BulkActionBar | `src/components/board/bulk-action-bar.tsx` | Multi-select operations |

---

## Implementation Phases

### Phase H.1: Shell & Navigation (Foundation)

**Create WorkBoardShell Component**
```tsx
// src/components/work-board/work-board-shell.tsx
interface WorkBoardShellProps {
  workspace: Workspace
  team: Team
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  currentUserId: string
}

// State to manage:
// - primaryTab: 'tasks' | 'work-items'
// - viewMode: 'table' | 'board' | 'timeline'
// - filters: FilterState (search, status, type, priority, assignee)

// Persist to localStorage: view preferences per workspace
```

**Create WorkBoardToolbar**
- Search input (searches tasks OR work items based on tab)
- Status filter (task statuses OR work item statuses)
- Type filter (task types OR work item types)
- Priority filter
- Assignee filter
- Column visibility (for table views)

**Tab Navigation**
- Primary: "Tasks" | "Work Items" (styled toggle group)
- Secondary: Table | Board | Timeline icons
- Use shadcn/ui Tabs + ToggleGroup components

**Files to Create:**
- `src/components/work-board/work-board-shell.tsx`
- `src/components/work-board/work-board-toolbar.tsx`
- `src/components/work-board/work-board-tabs.tsx`
- `src/components/work-board/view-mode-toggle.tsx`
- `src/components/work-board/shared/filter-context.tsx`

---

### Phase H.2: Tasks Views

**H.2.1 Tasks Table View**
- Columns: Status, Title, Type, Priority, Due Date, Assignee, Parent (work item/timeline)
- Sortable columns
- Inline status toggle (click to cycle)
- Row actions: Edit, Delete, Convert to Work Item
- Parent badge shows link to work item or timeline item

**H.2.2 Tasks Board View (Kanban)**
```
┌─────────────┬─────────────┬─────────────┐
│    To Do    │ In Progress │    Done     │
│    (12)     │     (5)     │    (28)     │
├─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │ Task A  │ │ │ Task D  │ │ │ Task G  │ │
│ │ 🔵 Dev  │ │ │ 🟣 QA   │ │ │ ✓ Done  │ │
│ │ Feature │ │ │ Bug #12 │ │ │         │ │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │
└─────────────┴─────────────┴─────────────┘
```

Features:
- Drag-drop to change status (uses existing dnd-kit)
- Task cards show: title, type badge, priority icon, parent link, due date
- Filter by: standalone only, linked only, or all
- Optional secondary grouping: by Type (research/design/dev/qa/etc.)

**H.2.3 Tasks Timeline View**
- Show tasks with due dates on a timeline
- X-axis: dates, Y-axis: tasks grouped by status or type
- Drag to reschedule (updates due_date)

**Files to Create:**
- `src/components/work-board/tasks-view/tasks-table-view.tsx`
- `src/components/work-board/tasks-view/tasks-board-view.tsx`
- `src/components/work-board/tasks-view/tasks-timeline-view.tsx`

---

### Phase H.3: Work Items Views

**H.3.1 Work Items Table View (Enhanced)**
- Keep current collapsed/expanded modes
- Add: task count badge per work item
- Add: inline progress bar (based on timeline item statuses)
- New column: "Tasks" showing count of linked tasks

**H.3.2 Work Items Board View (NEW - Key Feature)**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Planned   │ In Progress │  Completed  │   On Hold   │
│     (5)     │     (3)     │    (12)     │     (1)     │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │Feature A│ │ │Feature C│ │ │Feature E│ │ │Feature G│ │
│ │ MVP ■■□ │ │ │ MVP ■■■ │ │ │ ✓ Done  │ │ │ Blocked │ │
│ │ 5 tasks │ │ │ 2 tasks │ │ │         │ │ │         │ │
│ │ @John   │ │ │ @Sarah  │ │ │         │ │ │         │ │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

Features:
- Columns: planned, in_progress, completed, on_hold
- Cards show: name, type badge, timeline progress bars, task count, assignee
- Drag-drop to change status
- Click card to expand/view details

**H.3.3 Work Items Timeline View**
- Reuse existing Gantt implementation
- Group by: phase, assignee, priority, or MVP/SHORT/LONG

**Files to Create/Modify:**
- `src/components/work-board/work-items-view/work-items-board-view.tsx` (NEW)
- `src/components/work-board/work-items-view/work-items-table-view.tsx` (extract from features-table-view)
- Wire existing `timeline-view.tsx`

---

### Phase H.4: Smart Features (3.0 Enhancements)

**H.4.1 Cross-View Intelligence**
- When viewing Tasks, show work item context badge
- When viewing Work Items, show task aggregation counts
- Clicking parent link in Tasks view → switches to Work Items and highlights

**H.4.2 Quick Actions**
- "+" button in board columns to create item directly in that status
- Inline editing in table views (click cell to edit)
- Keyboard shortcuts: N (new), E (edit), / (search), ? (help)

**H.4.3 Bulk Operations**
- Multi-select with checkboxes
- Bulk status change, assignee change, delete
- Reuse existing `bulk-action-bar.tsx` component

**H.4.4 Persistent Preferences**
- Remember: primary tab, view mode, column visibility, sort order
- localStorage key: `work-board-preferences-{workspaceId}`

**H.4.5 Empty States**
- Custom empty state per view with helpful CTA
- "No tasks yet - Create your first task" with button
- "No work items in this status - Drag items here or create new"

---

## File Changes Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `components/work-board/work-board-shell.tsx` | Main container |
| `components/work-board/work-board-toolbar.tsx` | Unified filters |
| `components/work-board/work-board-tabs.tsx` | Primary navigation |
| `components/work-board/view-mode-toggle.tsx` | Table/Board/Timeline switch |
| `components/work-board/tasks-view/tasks-table-view.tsx` | Tasks in table format |
| `components/work-board/tasks-view/tasks-board-view.tsx` | Tasks kanban |
| `components/work-board/tasks-view/tasks-timeline-view.tsx` | Tasks timeline |
| `components/work-board/work-items-view/work-items-board-view.tsx` | Work items kanban |
| `components/work-board/shared/filter-context.tsx` | Shared filter state |

### Files to Modify

| File | Changes |
|------|---------|
| `app/(dashboard)/workspaces/[id]/_components/features-view.tsx` | Replace with WorkBoardShell |
| `components/features/features-table-view.tsx` | Extract to work-items-table-view |

### Reuse As-Is

| File | Usage |
|------|-------|
| `components/board/board-view.tsx` | Kanban logic and dnd-kit |
| `components/board/board-card.tsx` | Card component |
| `components/board/bulk-action-bar.tsx` | Bulk operations |
| `components/timeline/timeline-view.tsx` | Gantt chart |
| `components/product-tasks/task-list.tsx` | Task fetching logic |
| `components/product-tasks/task-card.tsx` | Task card display |

---

## Implementation Order (Recommended)

### Week 1: Foundation (H.1)
1. ✅ Create `work-board-shell.tsx` with basic structure
2. ✅ Create `work-board-toolbar.tsx` with shared filters
3. ✅ Create tab navigation (Tasks | Work Items)
4. ✅ Create view mode toggle (Table | Board | Timeline)
5. ✅ Wire up to features-view.tsx
6. ✅ Test basic navigation works

### Week 2: Tasks Views (H.2)
1. ✅ `tasks-table-view.tsx` - Table view for tasks
2. ✅ `tasks-board-view.tsx` - Kanban with drag-drop
3. ✅ Integrate with existing TaskList/TaskCard components
4. ✅ Add filter context for cross-view filtering
5. ✅ Test all task views

### Week 3: Work Items Views (H.3)
1. ✅ `work-items-board-view.tsx` - NEW Kanban for work items
2. ✅ Enhance work-items-table-view with task counts
3. ✅ Wire up existing timeline-view.tsx
4. ✅ Add bulk operations support
5. ✅ Test all work item views

### Week 4: Polish & Advanced Features (H.4)
1. ✅ Cross-view navigation (click parent in tasks → opens work item)
2. ✅ Keyboard shortcuts
3. ✅ Persistent preferences
4. ✅ Empty states and loading states
5. ✅ Mobile responsive adjustments
6. ✅ Final testing and bug fixes

---

## Technical Decisions

### State Management
- Use React Context for shared filter state across views
- Local component state for view-specific state
- localStorage for preferences persistence

### Drag & Drop
- Continue using dnd-kit (already installed: @dnd-kit/core, @dnd-kit/sortable)
- Reuse existing board-view.tsx patterns
- Add horizontal drag for timeline rescheduling

### Performance Considerations
- Virtualize large lists (use react-window if >100 items)
- Memoize filtered results with useMemo
- Lazy load non-visible views
- Debounce search input (300ms)

### API Considerations
- No new API endpoints needed initially
- Reuse existing: `/api/product-tasks`, `/api/work-items`
- Future: Consider `/api/work-items/[id]/task-count` for efficient aggregation

---

## Success Criteria

- [ ] Toggle between Tasks and Work Items views
- [ ] Each view has Table, Board, and Timeline modes
- [ ] Tasks Board: Kanban with todo/in_progress/done columns
- [ ] Work Items Board: Kanban with status columns
- [ ] Drag-drop status changes in all board views
- [ ] Unified filter bar works across all views
- [ ] Preferences persist across sessions
- [ ] Performance: <100ms view switch time
- [ ] Mobile responsive at 768px breakpoint

---

## Design Decisions Made

### Q1: Timeline View for Tasks
**Decision**: Tasks without due dates will be hidden in timeline view (filter them out). Only tasks with `due_date` set will appear.

### Q2: Board Grouping Options
**Decision**: Start with status grouping only. Future iteration can add:
- Task Type grouping (research/design/dev/qa)
- Assignee swimlanes
- Priority lanes

### Q3: Work Item Card Detail Level
**Decision**: Standard detail level:
- Name + type badge
- Timeline progress bars (MVP/SHORT/LONG)
- Task count badge
- Assignee avatar (if assigned)

### Q4: Quick Task Scope
**Decision**: Quick Task button creates standalone tasks by default. Can optionally link to work item via dropdown in the create dialog (existing functionality).

---

## Related Documentation

- [Product Tasks System](./week-5-review-system.md) - Tasks implementation
- [Existing Board Components](../reference/ARCHITECTURE.md) - Board/Kanban architecture
- [dnd-kit Usage](https://docs.dndkit.com/) - Drag-drop library docs

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-26 | Initial plan created | Claude |
| | | |
