# **WEEK 7: AI Integration, Feedback & Analytics**

**Last Updated:** 2025-11-30
**Status:** 🟡 In Progress (20%)

[← Previous: Week 6](week-6-timeline-execution.md) | [Back to Plan](README.md) | [Next: Week 8 →](week-8-billing-testing.md)

---

## Goal
AI chat, agentic mode, analytics dashboards, **Feedback Module**, **Integrations**, **AI Visual Prototypes**

---

## Related Documentation

| Document | Section | Description |
|----------|---------|-------------|
| [work-board-3.0.md](work-board-3.0.md#part-8-feedback-module-full-platform) | Part 8 | **Feedback Module** - Multi-channel feedback collection |
| [work-board-3.0.md](work-board-3.0.md#part-9-integrations-module) | Part 9 | **Integrations Module** - External service connections |
| [work-board-3.0.md](work-board-3.0.md#part-10-ai-visual-prototype-feature) | Part 10 | **AI Visual Prototypes** - Generate React UI from prompts |
| [work-board-3.0.md](work-board-3.0.md#part-7-work-item-detail-page-8-tab-structure) | Part 7 | Work Item Detail Page (AI Copilot tab reference) |

---

## Tasks

### Day 1-3: AI Chat Panel ✅ IMPLEMENTED

> **AI SDK Migration Complete** (2025-11-30)
> Uses Vercel AI SDK with OpenRouter provider and Parallel AI tools.

- [x] Left sidebar panel component: `components/ai/chat-panel.tsx`
  - Uses `useChat()` hook from `@ai-sdk/react`
  - Model selector, tool toggles, quick/deep research modes
- [x] Chat UI (messages, input, send button)
  - Streaming responses via AI SDK `toDataStreamResponse()`
  - Tool invocation display with expand/collapse
- [x] API route: `/app/api/ai/sdk-chat/route.ts` (NEW)
  - Uses `streamText()` from AI SDK
  - Supports workspace context injection
- [x] OpenRouter integration (`lib/ai/ai-sdk-client.ts`)
  - `@openrouter/ai-sdk-provider` for 300+ models
  - Pre-configured models: Claude Haiku, Grok 4, Kimi K2, Minimax M2
- [x] Parallel AI as tool layer (`lib/ai/tools/parallel-ai-tools.ts`)
  - `webSearch` - Real-time web search
  - `extractContent` - URL content extraction
  - `deepResearch` - Comprehensive research (30s-25min)
  - `quickAnswer` - Fast AI-generated answers
- [ ] Rich formatting (code blocks, tables, lists)
- [ ] [Deep Research] and [Find Similar] buttons (UI integration pending)

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

### Day 15-17: Feedback Module (Full Platform)

> **📋 Full Design Spec:** See [work-board-3.0.md Part 8](work-board-3.0.md#part-8-feedback-module-full-platform)

- [ ] Feedback Module page: `/app/(dashboard)/workspaces/[id]/feedback/page.tsx`
- [ ] **Multi-Channel Collection:**
  - [ ] In-app widget (floating button)
  - [ ] Public links (shareable URLs with feedback forms)
  - [ ] Email collection (parse incoming emails)
  - [ ] Embeddable iframe for external sites
- [ ] **Stakeholder Portal:**
  - [ ] Invite-based access for stakeholders
  - [ ] View-only dashboard for sharing
  - [ ] Voting/ranking interface
- [ ] **AI-Powered Analysis:**
  - [ ] Sentiment analysis on feedback text
  - [ ] Auto-categorization (feature request, bug, question)
  - [ ] Theme extraction (group similar feedback)
- [ ] **Feedback Triage:**
  - [ ] Convert feedback to work items
  - [ ] Link feedback to existing work items
  - [ ] Status tracking (new → reviewed → implemented)

### Day 18-19: Integrations Module

> **📋 Full Design Spec:** See [work-board-3.0.md Part 9](work-board-3.0.md#part-9-integrations-module)

- [ ] Integrations settings: `/app/(dashboard)/settings/integrations/page.tsx`
- [ ] Database: `team_integrations` table
- [ ] **Build In-House:**
  - [ ] Custom Forms Builder (drag-and-drop)
  - [ ] Multi-channel Feedback Dashboard
  - [ ] AI Summarization (Claude Haiku)
  - [ ] Basic Email Parsing (Resend/Postmark webhooks)
- [ ] **Integrate (3rd Party):**
  - [ ] Twilio (SMS + WhatsApp messaging)
  - [ ] SurveyMonkey/Typeform (survey imports)
  - [ ] OAuth2 connection flow
- [ ] **Integration Management UI:**
  - [ ] List connected integrations
  - [ ] Configure/disconnect integrations
  - [ ] Test connection status

### Day 20-21: AI Visual Prototype Feature

> **📋 Full Design Spec:** See [work-board-3.0.md Part 10](work-board-3.0.md#part-10-ai-visual-prototype-feature)

- [ ] API route: `/app/api/ai/generate-prototype/route.ts`
- [ ] Database: `ui_prototypes` and `prototype_votes` tables
- [ ] **Text-to-UI Generation:**
  - [ ] Prompt input with context (work item, resources)
  - [ ] Generate React/HTML code with Claude
  - [ ] Apply shadcn/ui component library
- [ ] **Interactive Preview:**
  - [ ] Sandboxed iframe preview
  - [ ] Basic interactivity (clicks, navigation)
  - [ ] Responsive toggle (mobile/tablet/desktop)
- [ ] **Feedback Collection:**
  - [ ] Share prototype via public link
  - [ ] Up/down voting system
  - [ ] Comments/annotations
- [ ] **Version History:**
  - [ ] Save multiple iterations
  - [ ] Compare side-by-side
  - [ ] Revert to previous version

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

### Feedback Module 👥

> **📋 Full Design Spec:** See [work-board-3.0.md Part 8](work-board-3.0.md#part-8-feedback-module-full-platform)

**Purpose:** Collect, analyze, and act on stakeholder and user feedback

**Multi-Channel Collection:**

| Channel | Description | Implementation |
|---------|-------------|----------------|
| **In-App Widget** | Floating feedback button | Build in-house |
| **Public Links** | Shareable feedback forms | Build in-house |
| **Email Collection** | Parse incoming emails | Resend/Postmark webhooks |
| **Embeddable Iframe** | External site integration | Build in-house (Pro) |
| **SMS/WhatsApp** | Text-based feedback | Twilio integration |
| **Survey Imports** | Import from SurveyMonkey/Typeform | API integration |

**AI-Powered Analysis:**
- Sentiment analysis (positive/neutral/negative)
- Auto-categorization (feature request, bug, question, praise)
- Theme extraction (group similar feedback)
- Action item extraction

**Feedback Lifecycle:**
```
New → Reviewed → Linked to Work Item → Implemented → Closed
```

### Integrations Module 🔌

> **📋 Full Design Spec:** See [work-board-3.0.md Part 9](work-board-3.0.md#part-9-integrations-module)

**Purpose:** Connect external services for enhanced feedback collection and communication

**Build vs Integrate Decision Matrix:**

| Feature | Decision | Reason |
|---------|----------|--------|
| Custom Forms | **BUILD** | Core differentiator |
| AI Summarization | **BUILD** | Already have Claude |
| Email Parsing | **BUILD** | Simple webhooks |
| SMS/WhatsApp | **INTEGRATE** | Twilio is mature |
| Survey Imports | **INTEGRATE** | Complex APIs |
| Video Calls | **INTEGRATE** | Not core |

**Database Schema:**
```sql
CREATE TABLE team_integrations (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id),
  provider TEXT NOT NULL,  -- 'twilio', 'surveymonkey', 'typeform'
  config JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### AI Visual Prototypes Module 🎨

> **📋 Full Design Spec:** See [work-board-3.0.md Part 10](work-board-3.0.md#part-10-ai-visual-prototype-feature)

**Purpose:** Generate visual UI mockups from text prompts for stakeholder feedback

**Features:**
- **Text-to-UI Generation** - Describe a feature, get React/HTML code
- **Interactive Preview** - Sandboxed iframe with basic interactivity
- **Feedback Collection** - Share via public link, collect votes and comments
- **Version History** - Track iterations and compare side-by-side

**Database Schema:**
```sql
CREATE TABLE ui_prototypes (
  id TEXT PRIMARY KEY,
  work_item_id TEXT REFERENCES work_items(id),
  prompt TEXT NOT NULL,
  generated_code TEXT NOT NULL,
  preview_url TEXT,
  version INT DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE prototype_votes (
  id TEXT PRIMARY KEY,
  prototype_id TEXT REFERENCES ui_prototypes(id),
  user_id TEXT,  -- NULL for anonymous
  vote INT CHECK (vote IN (-1, 1)),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**AI Generation Prompt Template:**
```
Generate a React component using shadcn/ui for: {user_prompt}

Context from work item:
- Title: {work_item.title}
- Description: {work_item.description}
- Resources: {work_item.resources}

Requirements:
- Use shadcn/ui components (Button, Card, Input, etc.)
- Use Tailwind CSS for styling
- Make it responsive
- Include basic interactivity
```

---

## Deliverables

### AI & Analytics (Days 1-14)
✅ AI chat panel with streaming responses
✅ Agentic panel with tool calling
✅ 20+ AI tools implemented
✅ Usage tracking (1,000 msgs/user/month enforced)
✅ 4 pre-built analytics dashboards
✅ Custom dashboard builder (Pro)

### Feedback & Integrations (Days 15-21)
✅ Feedback Module with multi-channel collection
✅ In-app widget, public links, email collection
✅ AI-powered feedback analysis (sentiment, categorization)
✅ Integrations Module (`team_integrations` table)
✅ Twilio integration for SMS/WhatsApp
✅ Survey imports (SurveyMonkey, Typeform)
✅ AI Visual Prototype generation
✅ Prototype preview and feedback collection

---

## Testing

### AI & Analytics Tests
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

### Feedback Module Tests
- [ ] Submit feedback via in-app widget
- [ ] Generate public feedback link, submit external feedback
- [ ] Verify sentiment analysis runs on submission
- [ ] Test feedback auto-categorization
- [ ] Convert feedback to work item
- [ ] Link existing feedback to work item
- [ ] Update feedback status through lifecycle

### Integrations Module Tests
- [ ] Connect Twilio integration (test credentials)
- [ ] Send test SMS feedback message
- [ ] Import survey from SurveyMonkey/Typeform
- [ ] Disconnect integration, verify data retained
- [ ] Test OAuth2 flow for third-party services

### AI Visual Prototype Tests
- [ ] Generate prototype from text prompt
- [ ] Verify React/HTML code generated
- [ ] Test sandboxed iframe preview renders
- [ ] Share prototype via public link
- [ ] Submit vote and comment on prototype
- [ ] Create new version, compare side-by-side

---

[← Previous: Week 6](week-6-timeline-execution.md) | [Back to Plan](README.md) | [Next: Week 8 →](week-8-billing-testing.md)
