# 🚀 Product Lifecycle Management Platform

![CI Status](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)
![Link Checker](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/check-links.yml/badge.svg)
![E2E Tests](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/playwright.yml/badge.svg?event=workflow_dispatch)

**Last Updated**: 2025-12-23
**Status**: 🏗️ **In Development** (Week 7 / 8-week timeline - 95% Complete)
**Live Preview**: [https://platform-test-cyan.vercel.app](https://platform-test-cyan.vercel.app)

A comprehensive AI-first platform for managing the complete product lifecycle - from research and ideation to execution and analytics.

---

## ✨ Overview

Transform your product development process with an integrated platform that covers:

1. **🧠 Research & Ideate** - AI-powered mind mapping, web search, knowledge base
2. **📋 Plan & Structure** - Features, timeline, dependencies, critical path analysis
3. **👥 Review & Gather Feedback** - Stakeholder input (invite-based, public links, iframe embeds)
4. **🚀 Execute Collaboratively** - Team assignment, task tracking, real-time collaboration
5. **🧪 Test & Iterate** - User feedback collection and analysis
6. **📊 Measure Success** - Analytics, expected vs actual performance tracking

---

## 🏗️ Tech Stack

```
Framework:    Next.js 16 + TypeScript (App Router, Server Components)
Database:     Supabase (PostgreSQL + Real-time + Auth + RLS)
UI:           shadcn/ui + Tailwind CSS + Lucide React
Mind Mapping: ReactFlow (custom nodes, AI-powered)
Charts:       Recharts (10+ chart types)
Testing:      Playwright (E2E) + Vitest (Unit)
Payments:     Razorpay (Orders + Subscriptions + Webhooks)
Email:        Resend (Invitations, notifications)
AI:           OpenRouter (Claude Haiku, Perplexity, Grok)
Deployment:   Vercel (Serverless functions)
```

---

## 📦 Project Structure

```
platform-test/
├── next-app/                    # Next.js 15 application
│   ├── app/                     # App Router pages
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Main application pages
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/                    # Utilities and configurations
│   │   └── supabase/           # Supabase client and types
│   └── hooks/                  # React Query hooks
│
├── supabase/                   # Supabase configuration
│   └── migrations/             # Database migrations (45 total)
│
├── docs/                       # Documentation
│   ├── implementation/         # Week-by-week implementation guide
│   ├── planning/               # Project management & progress tracking
│   ├── reference/              # Technical references & API docs
│   ├── postponed/              # Deferred features tracking
│   └── processes/              # How-to guides & workflows
│
├── CLAUDE.md                   # Project guidelines (700 lines)
├── .cursorrules                # Cursor AI behavior (570 lines)
└── cursor-mcp-config.json      # MCP server configuration
```

---

## 🎯 Current Implementation Status

### ✅ Completed (Weeks 1-7, ~92%)

**Foundation (Week 1-2) - 100%:**
- ✅ Next.js 15 + TypeScript setup with App Router
- ✅ Supabase integration (Auth + SSR + Database)
- ✅ Authentication pages (login, signup, onboarding)
- ✅ Multi-tenant architecture (teams, team_members, workspaces)
- ✅ RLS policies for all 25+ tables (team isolation)
- ✅ 44 database migrations applied
- ✅ shadcn/ui + Tailwind CSS + Lucide icons

**Mind Mapping (Week 3) - 100%:**
- ✅ ReactFlow canvas with zoom, pan, fit view
- ✅ 5 node types: idea, feature, problem, solution, note
- ✅ Custom shape nodes: arrow, circle, rectangle, sticky-note, text
- ✅ Work item reference nodes (link to features)
- ✅ 5 template categories: Product, Marketing, Research, Development, Design
- ✅ Real-time canvas state persistence

**Feature Planning (Week 4) - 80%:**
- ✅ Features CRUD: create, read, update, delete
- ✅ Timeline items: MVP/SHORT/LONG breakdown
- ✅ 4-type system: concept, feature, bug, enhancement
- ✅ Dependencies API and linked items
- ⏳ Interactive dependency graph visualization
- ⏳ Critical path analysis

**Team Management & Work Items (Week 5) - 95%:**
- ✅ Team invitation with email + phase assignments
- ✅ Phase-based permission system (Owner/Admin/Member)
- ✅ Phase-aware forms with progressive disclosure
- ✅ Edit work item dialog with field locking
- ✅ Timeline status manager (8 states)
- ✅ Feedback triage + convert workflows
- ✅ Unified canvas for mind maps + feedback boards
- ✅ 16 E2E test scenarios

### 📋 Planned (Weeks 6-8)

**Week 6: Timeline & Execution**
- Gantt chart visualization
- Drag-to-reschedule with dependency validation
- Team assignment and task tracking
- Real-time collaboration (Pro tier)

**Week 7: AI Integration & Analytics**
- OpenRouter AI chat panel
- Agentic mode (20+ tools)
- External review system
- Analytics dashboards

**Week 8: Billing, Testing & Launch**
- Stripe integration (Checkout + Webhooks)
- Feature gates (5 users Free, unlimited Pro)
- Full E2E test suite
- Security audit and production deployment

---

## 🚀 Quick Start

### Prerequisites

- Bun 1.2+ and Node.js 18+
- Supabase account ([supabase.com](https://supabase.com))
- Vercel account (optional, for deployment)

### Installation

1. **Clone the repository**
   ```bash
   cd "c:\Users\harsh\Downloads\Platform Test"
   ```

2. **Install dependencies**
   ```bash
   cd next-app
   bun install --frozen-lockfile
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Apply database migrations**
   ```bash
   cd ..
   bunx supabase db push
   ```

5. **Run development server**
   ```bash
   cd next-app
   bun run dev
   ```

6. **Open the app**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Sign up for a new account
   - Create your first workspace

---

## 🔧 MCP Servers (Optional)

This project uses **Model Context Protocol (MCP)** servers for enhanced AI capabilities:

### Active MCP Servers (3)

1. **Supabase MCP** - Documentation search, schema introspection, migrations, RLS
2. **shadcn/ui MCP** - Component installation, multi-registry access
3. **Context7 MCP** - Fetch up-to-date documentation for libraries/frameworks

**Additional Tools**:
- **Parallel AI Skill** - Web search, data extraction, deep research (via Claude skill)

**Configuration**: Configure MCP servers in your editor's settings (file not tracked in git)

**Optimization**: Token usage optimized with lazy loading + skill-based abstraction.

---

## 📚 Documentation

### Essential Reading

| Document | Purpose | Lines |
|----------|---------|-------|
| [CLAUDE.md](CLAUDE.md) | Project guidelines, tech stack, quick reference | 700 |
| [docs/implementation/README.md](docs/implementation/README.md) | Implementation plan overview, architecture, pricing | 318 |
| [docs/planning/RECOMMENDED_AGENTS.md](docs/planning/RECOMMENDED_AGENTS.md) | Claude agents mapped to implementation phases | 614 |
| [docs/reference/MCP_USAGE_GUIDE.md](docs/reference/MCP_USAGE_GUIDE.md) | MCP usage examples and patterns | 468 |
| [docs/postponed/MIND_MAP_ENHANCEMENTS.md](docs/postponed/MIND_MAP_ENHANCEMENTS.md) | Postponed features (23 enhancements) | 1,672 |
| [.cursorrules](.cursorrules) | Cursor AI behavior and coding standards | 570 |

### Additional Documentation (Coming Soon)

- **PROGRESS.md** - Weekly implementation tracker with completion percentages
- **CHANGELOG.md** - Migration history and feature tracking
- **NEXT_STEPS.md** - Immediate actions and priorities
- **ARCHITECTURE.md** - System architecture diagrams (Mermaid)
- **API_REFERENCE.md** - API routes documentation

---

## 🎯 Key Features (10 Modules)

| Module | Phase | Priority | Status |
|--------|-------|----------|--------|
| **Mind Mapping** 🧠 | Week 3 | **CRITICAL** | ✅ 100% |
| **Feature Planning** 📋 | Week 4 | High | ✅ 80% |
| **Dependency Management** 🔗 | Week 4 | High | ⏳ 70% |
| **Team Management** 👥 | Week 5 | High | ✅ 95% |
| **Work Items UI** 📝 | Week 5 | High | ✅ 95% |
| **Project Execution** 🚀 | Week 6 | Medium | ❌ Not Started |
| **Timeline Visualization** 📅 | Week 6 | High | ❌ Not Started |
| **Research & Discovery** 🔍 | Week 7 | High | ❌ Not Started |
| **Analytics & Metrics** 📊 | Week 7 | Medium | ❌ Not Started |
| **AI Assistant** 🤖 | Week 7 | High | ❌ Not Started |

---

## 💰 Pricing Model

**Free Tier:**
- Unlimited workspaces
- Basic features
- 5 team members max
- 500 AI messages/month

**Pro Tier ($40/team/month + $5/user):**
- Everything in Free
- Unlimited team members (5 included)
- External review system (iframe embeds)
- Real-time collaboration (live cursors)
- Custom analytics dashboards
- Agentic AI mode (1,000 msgs/user/month)

---

## 🔒 Multi-Tenant Architecture

### Data Isolation
- All tables include `team_id` for data separation
- Row-Level Security (RLS) policies enforce access control
- Workspace = Project (each workspace is a separate product/project)

### ID Format
- **Timestamp-based TEXT IDs**: `Date.now().toString()`
- ❌ **NEVER use UUID** (documented in CLAUDE.md)

### Database Schema

**Core Tables:**
```
users           - User accounts (Supabase Auth)
teams           - Organizations/teams
team_members    - Team membership and roles
subscriptions   - Stripe billing data
workspaces      - Projects with phase and modules
```

**Feature Tables:**
```
features        - Top-level roadmap items
timeline_items  - MVP/SHORT/LONG breakdowns
linked_items    - Dependencies and relationships
feature_connections - Dependency graph data
```

**Mind Mapping Tables:**
```
mind_maps       - Canvas data (ReactFlow JSON)
mind_map_nodes  - Individual nodes (5 types)
mind_map_edges  - Connections between nodes
```

**Review & Feedback Tables (Planned):**
```
review_links    - Public/invite/iframe links
feedback        - Reviewer submissions
```

**Analytics Tables (Planned):**
```
custom_dashboards - User-created dashboards
success_metrics   - Expected vs actual tracking
ai_usage          - Message count per user/month
```

---

## 🧪 Testing

**Current Status**: ✅ E2E Testing Infrastructure Complete

**Available Tests (Playwright):**
- Authentication flow (login, signup, onboarding)
- Workspace CRUD operations
- Work item management
- Team invitation flow
- Mind map canvas interactions
- 16 E2E test scenarios total

**Run Tests:**
```bash
cd next-app
bun run test:e2e          # Run all tests
bun run test:e2e:ui       # Run with UI
bun run test:e2e:headed   # Run in browser
bun run test:report       # View test report
```

**Planned (Week 8):**
- Jest unit tests for React components
- React Testing Library integration tests
- Full E2E test suite expansion

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Automatic deployment via GitHub integration
   - Or manually: `vercel --prod`

3. **Configure Environment Variables**
   - Add Supabase URL and anon key
   - Add OpenRouter API key (for AI features)
   - Add Stripe keys (for billing)
   - Add Resend API key (for emails)

**Live URL**: [https://platform-test-cyan.vercel.app](https://platform-test-cyan.vercel.app)

---

## 🤝 Contributing

### Coding Standards

- ✅ Use TypeScript strict mode, avoid `any`
- ✅ Use shadcn/ui components (not custom UI libraries)
- ✅ Filter all queries by `team_id` for multi-tenancy
- ✅ Enable RLS on all tables
- ✅ Use timestamp-based IDs (`Date.now().toString()`)
- ✅ Test on mobile (mobile-first design)

See [CLAUDE.md](CLAUDE.md) for comprehensive coding guidelines.

### Documentation Maintenance

**When to Update Documentation:**
- ✅ Database schema changes → Update docs/implementation/database-schema.md + CHANGELOG.md
- ✅ Tech stack changes → Update README.md + CLAUDE.md
- ✅ Process changes → Update CLAUDE.md + .cursorrules
- ✅ Phase completions → Update docs/implementation/week-X-Y.md + PROGRESS.md
- ✅ Postponed features → Create docs/postponed/[FEATURE_NAME].md + Update postponed-features.md

**Documentation Sync Schedule:**
- **Daily**: Update PROGRESS.md, add CHANGELOG.md entries
- **Weekly**: Review docs/implementation/week-X-Y.md, update README.md
- **Monthly**: Full documentation audit, fix inconsistencies

---

## 📊 Implementation Timeline

**Original Plan**: 8 weeks (extended to 12 weeks for quality)
**Current Progress**: ~60-65% complete (Week 6)
**Status**: ✅ On Track

**Completed Work:**
- ✅ Week 1-2: Foundation (100% complete)
- ✅ Week 3: Mind Mapping (100% complete)
- ✅ Week 4: Feature Planning (90% complete)
- ✅ Week 5: Team Management & Work Items (100% complete)

**Current Week (6):**
1. Timeline visualization (Gantt chart)
2. Real-time collaboration foundation
3. Project execution features

**Upcoming:**
- Week 7: AI Integration & Analytics
- Week 8: Billing, Testing & Launch

See [docs/implementation/README.md](docs/implementation/README.md) for detailed implementation plan and weekly breakdown.

---

## 🐛 Known Issues

1. **AI Integration** - OpenRouter client not yet implemented (Week 7)
2. **Billing** - Stripe integration not started (Week 8)
3. **Timeline Visualization** - Gantt chart not implemented (Week 6 priority)
4. **Critical Path Analysis** - Dependency graph visualization pending

**Resolved:**
- ✅ Mind Map Canvas - ReactFlow implementation complete
- ✅ RLS Policies - Multi-tenant security verified
- ✅ Testing Infrastructure - Playwright setup with 16 E2E scenarios

---

## 📄 License

Free to use and modify for personal and commercial projects.

---

## 🎯 Use Cases

- Planning SaaS product roadmaps
- Managing feature requests and prioritization
- Organizing development sprints and milestones
- Tracking dependencies and critical path
- Gathering stakeholder feedback
- Analyzing product performance metrics
- Collaborating with distributed teams

---

## 📞 Support

**Documentation**: See [CLAUDE.md](CLAUDE.md) for comprehensive guidelines
**Issues**: Create an issue in the GitHub repository
**Questions**: Use the AI chat assistant (coming in Week 7)

---

**Made with ❤️ for product builders and developers**

🚀 **Ready to transform your product development process!**
