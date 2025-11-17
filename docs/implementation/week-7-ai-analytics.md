# **WEEK 7: AI Integration & Analytics**

**Last Updated:** 2025-11-14
**Status:** ❌ Not Started

[← Previous: Week 6](week-6-timeline-execution.md) | [Back to Plan](README.md) | [Next: Week 8 →](week-8-billing-testing.md)

---

## Goal
AI chat, agentic mode, analytics dashboards

---

## Tasks

### Day 1-3: AI Chat Panel
- [ ] Left sidebar panel component: `components/ai/chat-panel.tsx`
- [ ] Chat UI (messages, input, send button)
- [ ] Streaming responses (Server-Sent Events)
- [ ] API route: `/app/api/ai/chat/route.ts`
- [ ] OpenRouter integration (`lib/ai/openrouter.ts`)
- [ ] Model router (`lib/ai/model-router.ts`)
  - [ ] Default: Claude Haiku
  - [ ] Research: Perplexity (when user clicks button)
  - [ ] Speed: Grok Fast (auto-complete)
- [ ] Rich formatting (code blocks, tables, lists)
- [ ] [Deep Research] and [Find Similar] buttons

### Day 4-6: Agentic Panel
- [ ] Right sidebar panel: `components/ai/agentic-panel.tsx`
- [ ] Tool calling interface
- [ ] Implement 20+ AI tools in `lib/ai/tools/`:
  - [ ] `create-feature.ts`
  - [ ] `update-feature.ts`
  - [ ] `suggest-dependencies.ts`
  - [ ] `analyze-feedback.ts`
  - [ ] (17 more...)
- [ ] Approval workflow:
  - [ ] AI proposes action
  - [ ] Show preview (diff)
  - [ ] [✓ Approve] [✗ Deny] buttons
  - [ ] Execute on approval
- [ ] Action history log

### Day 7-8: Usage Tracking
- [ ] Track AI messages per user per month
- [ ] Insert/update `ai_usage` table
- [ ] Check quota before AI call:
  - [ ] Free: 50 messages/month (team)
  - [ ] Pro: 1,000 messages/user/month
- [ ] Show usage in settings:
  ```
  Usage This Month:
  ████████░░ 847 / 1,000 messages
  Resets in 14 days
  ```
- [ ] Block requests if over quota (show upgrade modal)

### Day 9-11: Pre-built Analytics Dashboards
- [ ] Analytics page: `/app/(dashboard)/analytics/page.tsx`
- [ ] 4 pre-built dashboards:
  1. **Feature Overview**
     - [ ] Pie chart (features by status)
     - [ ] Line chart (progress over time)
     - [ ] Bar chart (features by category)
  2. **Dependency Health**
     - [ ] Network graph (critical path)
     - [ ] List (blocked features)
     - [ ] Gauge (risk score)
  3. **Team Performance**
     - [ ] Bar chart (completed per member)
     - [ ] Metric card (avg completion time)
     - [ ] Heatmap (workload distribution)
  4. **Success Metrics**
     - [ ] Table (expected vs actual)
     - [ ] Progress bars (goals achieved)
- [ ] Install chart library:
  ```bash
  npm install recharts
  ```

### Day 12-14: Custom Dashboard Builder (Pro)
- [ ] Dashboard builder page: `/app/(dashboard)/analytics/custom/page.tsx`
- [ ] Widget library (sidebar):
  - [ ] Metric cards
  - [ ] Line chart
  - [ ] Bar chart
  - [ ] Pie chart
  - [ ] Table
  - [ ] Text block
- [ ] Drag-and-drop widgets to canvas
- [ ] Configure widget (data source, filters)
- [ ] Save dashboard layout (JSONB)
- [ ] AI insights widget (auto-generated)

---

## Module Features

### AI Assistant Module 🤖

**Active By Default:** All phases (always on, adapts to context)

**Purpose:** AI-powered assistance at every step

**Architecture:** Three distinct interfaces for different needs

#### **Interface 1: Research Chat** 🔍

**Location:** Left sidebar panel (always accessible)

**Features:**
- Chat interface with message history
- Web search buttons:
  - **[Deep Research]** - Triggers Perplexity Sonar
  - **[Find Similar]** - Triggers Exa semantic search
- Save responses to Knowledge Base
- Multi-turn conversations (context aware)
- Rich formatting (code blocks, tables, bullet lists)
- Attachments (upload images, files)

**Models Used:**
- **Primary:** Claude Haiku 4.5 (general chat)
- **Research:** Perplexity Sonar (web search)
- **Semantic:** Exa API (finding similar content)

#### **Interface 2: Agentic Execution Panel** 🤖 **[PRO TIER ONLY]**

**Location:** Right sidebar panel (toggle on/off with button)

**Features:**
- **Tool Calling Interface** - AI uses tools to perform actions
- **Preview Actions** - See exactly what AI will do before it happens
- **Approval Workflow:**
  - AI proposes action
  - User sees preview (before/after diff)
  - User clicks **✓ Approve** or **✗ Deny**
  - Only then does action execute
- **Batch Operations:**
  - "Create 10 features from this CSV"
  - "Assign all MVP features to Alex"
  - "Update difficulty for all backend features to Hard"
- **Action History Log** - Audit trail of all AI actions

**Model:** Claude Haiku 4.5 (best at tool calling with JSON)

**Available Tools (20+):**

| Category | Tools | Description |
|----------|-------|-------------|
| **Feature Management** | `create_feature`, `update_feature`, `delete_feature` | CRUD operations |
| **Dependencies** | `create_dependency`, `suggest_dependencies`, `analyze_critical_path` | Link features |
| **Planning** | `prioritize_features`, `estimate_difficulty`, `suggest_timeline` | Planning help |
| **Execution** | `assign_team`, `generate_execution_steps`, `update_status` | Tracking |
| **Mind Mapping** | `create_mind_map`, `convert_nodes_to_features`, `suggest_connections` | Visual ideation |
| **Feedback** | `analyze_feedback`, `summarize_reviews`, `extract_action_items` | Review insights |
| **Research** | `search_research`, `find_similar_features`, `get_market_data` | Information gathering |
| **Export** | `export_data`, `generate_report`, `create_presentation` | Data output |
| **Text** | `improve_description`, `generate_user_story`, `translate_content` | Writing help |
| **Analysis** | `check_duplicates`, `identify_gaps`, `calculate_metrics` | Insights |

#### **Interface 3: Inline AI Assistance** ✨

**Location:** Throughout UI (context menus, floating buttons)

**Features:**
- **"Improve this" buttons** - Inline on text fields
- **"Suggest..." actions** - Context-aware recommendations
- **Auto-complete** - As you type (feature names, descriptions)
- **Smart suggestions** - Proactive AI help

**Model:** Grok 4 Fast (for speed) or Claude Haiku (for quality)

### AI Model Routing Strategy

**Goal:** Minimize cost while maximizing quality

| Task Type | Model | Cost | Why |
|-----------|-------|------|-----|
| Tool calling (agentic mode) | Claude Haiku 4.5 | $0.25/1M | Best at structured output |
| General chat | Claude Haiku 4.5 | $0.25/1M | Great quality, fast |
| Deep research | Perplexity Sonar | $1/1M | Web search capability |
| Semantic search | Exa API | $0.01/query | Finding similar content |
| Auto-complete (speed) | Grok 4 Fast | $0.50/1M | 2-3x faster response |
| Free tier overflow | GLM-4-Plus | $0.10/1M | 10x cheaper fallback |

### Analytics & Metrics Module 📊

**Purpose:** Measure success, track performance, generate insights

**Features:**

#### Pre-built Dashboards (4 Standard):

1. **Feature Overview**
   - Total features by status (pie chart)
   - Progress over time (line chart)
   - Features by category (bar chart)
   - Completion rate (percentage)

2. **Dependency Health**
   - Critical path visualization (network graph)
   - Blocked features (list with reasons)
   - Risk score (gauge: Low/Medium/High)
   - Bottlenecks (features blocking many others)

3. **Team Performance**
   - Features completed per member (bar chart)
   - Average completion time (metric card)
   - Workload distribution (heatmap)
   - Velocity trend (line chart)

4. **Success Metrics**
   - Expected vs Actual (comparison table)
   - Feature success rate (percentage)
   - User feedback trends (line chart)
   - Goals achieved (progress bars)

#### Custom Dashboard Builder **[PRO ONLY]**:
- **Drag-and-drop widgets** - Build your own dashboard
- **Chart Types** (10+):
  - Line, Bar, Pie, Scatter, Heatmap, Funnel, Gauge, Area, Radar, Treemap
- **Widget Types:**
  - **Metric Cards** - Single number with trend arrow (↑/↓)
  - **Charts** - Visual data representation
  - **Tables** - Sortable, filterable data grids
  - **Text Blocks** - Notes, explanations, context
  - **AI Insights** - Auto-generated summaries

---

## Deliverables

✅ AI chat panel with streaming responses
✅ Agentic panel with tool calling
✅ 20+ AI tools implemented
✅ Usage tracking (1,000 msgs/user/month enforced)
✅ 4 pre-built analytics dashboards
✅ Custom dashboard builder (Pro)

---

## Testing

- [ ] Open AI chat, send 5 messages
- [ ] Click [Deep Research], verify Perplexity used
- [ ] Open agentic panel
- [ ] Ask AI to "Create 3 features from this list"
- [ ] Verify preview appears
- [ ] Approve, verify features created
- [ ] Check usage counter increments
- [ ] View analytics dashboards
- [ ] Create custom dashboard with 5 widgets
- [ ] Verify data displays correctly

---

[← Previous: Week 6](week-6-timeline-execution.md) | [Back to Plan](README.md) | [Next: Week 8 →](week-8-billing-testing.md)
