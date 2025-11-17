# **WEEK 6: Timeline Visualization & Execution**

**Last Updated:** 2025-11-14
**Status:** ❌ Not Started

[← Previous: Week 5](week-5-review-system.md) | [Back to Plan](README.md) | [Next: Week 7 →](week-7-ai-analytics.md)

---

## Goal
Gantt chart, team assignment, task tracking

---

## Tasks

### Day 1-3: Timeline Library
- [ ] Choose library (react-big-calendar recommended)
- [ ] Install:
  ```bash
  npm install react-big-calendar date-fns
  ```
- [ ] Create timeline page: `/app/(dashboard)/timeline/page.tsx`
- [ ] Render features as events (horizontal bars)
- [ ] Quarter-based view (Q1, Q2, Q3, Q4 columns)

### Day 4-5: Drag-to-Reschedule
- [ ] Enable drag-and-drop on timeline
- [ ] Update feature dates when dragged
- [ ] Show date picker on click (precise dates)
- [ ] Validate dependencies (warn if violates)

### Day 6-7: Dependency Arrows
- [ ] Render SVG arrows between dependent features
- [ ] Calculate arrow paths (start/end coordinates)
- [ ] Different arrow styles per link type:
  - [ ] Solid for dependencies
  - [ ] Dashed for blocks
- [ ] Hover to highlight path

### Day 8-9: Swimlanes & Filters
- [ ] Group by:
  - [ ] Team (Backend, Frontend, Mobile)
  - [ ] Status (Not Started, In Progress, Done)
  - [ ] Category
  - [ ] Assignee
- [ ] Filter panel (multi-select dropdowns)
- [ ] Zoom levels (month/quarter/year buttons)

### Day 10-12: Project Execution Module
- [ ] Feature detail page: `/app/(dashboard)/features/[id]/page.tsx`
- [ ] Tabs:
  - [ ] Overview (description, timeline)
  - [ ] **Execution** (new tab)
  - [ ] Resources (links, files)
  - [ ] Analytics (metrics)
- [ ] Execution tab features:
  - [ ] Team assignment (dropdown, search members)
  - [ ] Execution steps (checklist with subtasks)
  - [ ] Status dropdown (Not Started → Done)
  - [ ] Resource links (Figma, GitHub, docs)
  - [ ] Milestones (date + description)
  - [ ] Prerequisites (list of required items)
  - [ ] Risk tracking (severity + mitigation)

### Day 13-14: Real-time Collaboration
- [ ] Supabase Realtime subscriptions
- [ ] Live cursors on timeline (see teammates)
- [ ] Presence indicators (green dot = online)
- [ ] Activity feed component: `components/shared/activity-feed.tsx`
  - [ ] Recent changes log
  - [ ] "Alex edited 'User Auth' 5 min ago"
  - [ ] "Sarah added milestone to 'Payment'"
- [ ] @mentions in comments
- [ ] Notifications (in-app + email)

---

## Module Features

### Timeline Visualization Module 📅

**Purpose:** Gantt-style view, schedule features, visualize dependencies

**Technology:** react-big-calendar or vis-timeline

**Features:**
- **Gantt Chart** - Horizontal bars showing feature duration
- **Quarter-Based View** - Q1, Q2, Q3, Q4 columns (or custom date ranges)
- **Drag-to-Reschedule** - Change dates visually (drag bar left/right)
- **Dependency Arrows** - SVG lines connecting dependent features
- **Swimlanes** - Group by:
  - Team (Backend, Frontend, Mobile)
  - Status (Not Started, In Progress, Done)
  - Category (Feature, Bug, Technical Debt)
  - Assignee (Alex, Sarah, David)
- **Zoom Levels:**
  - Day view (granular)
  - Week view
  - Month view
  - Quarter view (strategic)
  - Year view (long-term)
- **Filters** - Show/hide based on team, status, category, assignee
- **Export** - PNG, PDF, JSON

**AI Features:**
- **Suggest optimal scheduling** based on dependencies
- **Detect conflicts** (two features scheduled simultaneously with same person)
- **Predict completion dates** based on historical velocity
- **Recommend resource allocation** (who should work on what)

### Project Execution Module 🚀

**Purpose:** Track implementation progress, assign work

**Features:**
- **Team Assignment** - Assign features to specific members or sub-teams
- **Execution Steps** - Break down into tasks/subtasks (checklist)
- **Status Tracking** - Not Started → In Progress → Blocked → Done
- **Resource Management** - Links to:
  - Figma designs
  - API documentation
  - Technical specs
  - GitHub repos
- **Milestones** - Key dates and deliverables (e.g., "API Complete" - March 15)
- **Prerequisites** - What's needed before starting (e.g., "Design approval")
- **Risk Tracking** - Identify and mitigate risks (e.g., "Third-party API may not be stable")

### Collaboration Module 🤝 **[PRO TIER ONLY]**

**Purpose:** Real-time teamwork, reduce silos

**Features:**

#### Real-time Editing:
- **Live Cursors** - See where teammates are working (like Figma)
- **Presence Indicators** - Green dot = online
- **Instant Updates** - See changes immediately (no refresh)

#### Communication:
- **Team Chat** - Per-workspace chat room
- **Activity Feed** - Recent changes log ("Alex edited 'User Auth' 5 min ago")
- **@Mentions** - Notify specific team members in comments
- **Notifications:**
  - In-app notifications (bell icon)
  - Email notifications (configurable)

**Technology:** Supabase Realtime subscriptions (WebSocket-based)

---

## Deliverables

✅ Interactive timeline (Gantt chart)
✅ Drag-to-reschedule
✅ Dependency arrows (visual)
✅ Swimlanes and filters
✅ Team assignment and task tracking
✅ Real-time collaboration (cursors, activity feed)

---

## Testing

- [ ] Create 15 features with dates spanning 4 quarters
- [ ] Open timeline view
- [ ] Drag feature to new quarter
- [ ] Verify dependency arrows update
- [ ] Group by team, verify swimlanes
- [ ] Assign feature to team member
- [ ] Add execution steps (5 tasks)
- [ ] Open in 2 tabs, verify real-time updates
- [ ] Check activity feed shows recent actions

---

[← Previous: Week 5](week-5-review-system.md) | [Back to Plan](README.md) | [Next: Week 7 →](week-7-ai-analytics.md)
