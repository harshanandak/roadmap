# 🚀 Product Lifecycle Management Platform

**Last Updated**: 2025-11-14
**Status**: 🏗️ **In Development** (Week 3-4 / 8-week timeline)
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
Framework:    Next.js 15 + TypeScript (App Router, Server Components)
Database:     Supabase (PostgreSQL + Real-time + Auth + RLS)
UI:           shadcn/ui + Tailwind CSS + Lucide React
Mind Mapping: ReactFlow (custom nodes, AI-powered)
Charts:       Recharts (10+ chart types)
Testing:      Playwright (E2E) + Jest (Unit)
Payments:     Stripe (Checkout + Webhooks)
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
│   └── migrations/             # Database migrations (24 total)
│
├── docs/                       # Documentation
│   ├── IMPLEMENTATION_PLAN.md  # 8-week roadmap
│   ├── RECOMMENDED_AGENTS.md   # Claude agents by phase
│   ├── MIND_MAP_ENHANCEMENTS.md # Postponed features
│   └── MCP_OPTIMIZATION_SUMMARY.md # MCP configuration
│
├── CLAUDE.md                   # Project guidelines (700 lines)
├── .cursorrules                # Cursor AI behavior (570 lines)
└── cursor-mcp-config.json      # MCP server configuration
```

---

## 🎯 Current Implementation Status

### ✅ Completed (Weeks 1-3, ~25%)

**Foundation (Week 1-2):**
- ✅ Next.js 15 + TypeScript setup with App Router
- ✅ Supabase integration (Auth + SSR + Database)
- ✅ Authentication pages (login, signup, onboarding)
- ✅ Team and workspace structure
- ✅ Multi-tenant database schema (24 migrations)
- ✅ shadcn/ui component library integration

**Mind Mapping (Week 3 - Partial):**
- ✅ Mind maps list view + CRUD operations
- ✅ Database tables (mind_maps, mind_map_nodes, mind_map_edges)
- ✅ API routes for mind map operations
- ⏳ ReactFlow canvas implementation (verify)
- ⏳ AI integration for node suggestions
- ⏳ Template system
- ⏳ Convert to features workflow

**Features & Dependencies (Week 4 - Partial):**
- ✅ Database schema (features, timeline_items, linked_items, feature_connections)
- ✅ API routes for dependencies
- ⏳ Frontend UI for feature management
- ⏳ ReactFlow dependency graph
- ⏳ Critical path analysis

### ⏳ In Progress (Week 4-5)

- Feature planning dashboard
- Dependency visualization with ReactFlow
- 4 link types (dependency, blocks, complements, relates)

### 📋 Planned (Weeks 5-8)

**Week 5: Review System**
- Public review links
- Invite-based feedback
- Resend email integration
- iframe embeds (Pro tier)

**Week 6: Timeline & Execution**
- Gantt chart visualization
- Team assignment and task tracking
- Real-time collaboration (Pro tier)
- Live cursors and presence

**Week 7: AI Integration & Analytics**
- OpenRouter AI chat panel
- Agentic mode (20+ tools)
- Custom dashboard builder (Pro tier)
- Pre-built analytics dashboards

**Week 8: Billing, Testing & Launch**
- Stripe integration (Checkout + Webhooks)
- Feature gates (5 users Free, unlimited Pro)
- Playwright E2E tests
- Jest unit tests
- Production deployment
- Security audit

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
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
   npm install
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
   npx supabase db push
   ```

5. **Run development server**
   ```bash
   cd next-app
   npm run dev
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
2. **Playwright MCP** - E2E testing, browser automation, screenshots
3. **Parallel-search MCP** - Multi-source web search and research

**Configuration**: See [cursor-mcp-config.json](cursor-mcp-config.json)

**Optimization**: Token usage reduced from 28.8k → 5k (83% reduction). See [MCP_OPTIMIZATION_SUMMARY.md](MCP_OPTIMIZATION_SUMMARY.md) for details.

---

## 📚 Documentation

### Essential Reading

| Document | Purpose | Lines |
|----------|---------|-------|
| [CLAUDE.md](CLAUDE.md) | Project guidelines, tech stack, quick reference | 700 |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | 8-week roadmap, architecture, database schema | 2,419 |
| [RECOMMENDED_AGENTS.md](RECOMMENDED_AGENTS.md) | Claude agents mapped to implementation phases | 614 |
| [MCP_OPTIMIZATION_SUMMARY.md](MCP_OPTIMIZATION_SUMMARY.md) | MCP configuration and context optimization | 370 |
| [MIND_MAP_ENHANCEMENTS.md](MIND_MAP_ENHANCEMENTS.md) | Postponed features (23 enhancements) | 1,672 |
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
| **Mind Mapping** 🧠 | Week 3 | **CRITICAL** | ⏳ 30% |
| **Feature Planning** 📋 | Week 4 | High | ⏳ 20% |
| **Dependency Management** 🔗 | Week 4 | High | ⏳ 15% |
| **Review & Feedback** 👥 | Week 5 | Medium | ❌ Not Started |
| **Project Execution** 🚀 | Week 6 | Medium | ❌ Not Started |
| **Collaboration** 🤝 | Week 6 | Medium | ❌ Not Started |
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

**Current Status**: ❌ No automated tests yet (planned for Week 8)

**Planned Testing:**
- **Playwright** - E2E tests (authentication, feature CRUD, mind mapping)
- **Jest** - Unit tests for React components
- **React Testing Library** - Component integration tests

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
- ✅ Database schema changes → Update IMPLEMENTATION_PLAN.md + CHANGELOG.md
- ✅ Tech stack changes → Update README.md + CLAUDE.md
- ✅ Process changes → Update CLAUDE.md + .cursorrules
- ✅ Phase completions → Update IMPLEMENTATION_PLAN.md + PROGRESS.md
- ✅ Postponed features → Create [FEATURE_NAME].md + Update IMPLEMENTATION_PLAN.md

**Documentation Sync Schedule:**
- **Daily**: Update PROGRESS.md, add CHANGELOG.md entries
- **Weekly**: Review IMPLEMENTATION_PLAN.md, update README.md
- **Monthly**: Full documentation audit, fix inconsistencies

---

## 📊 Implementation Timeline

**Original Plan**: 8 weeks (6-8 weeks realistic estimate)
**Current Progress**: ~25% complete (Week 3-4)
**Status**: ⚠️ Behind schedule

**Completed Work:**
- ✅ Week 1-2: Foundation (50% complete)
- ⏳ Week 3: Mind Mapping (30% complete)
- ⏳ Week 4: Dependencies (15% complete)

**Next Priorities:**
1. Complete mind mapping canvas (ReactFlow)
2. Implement AI integration (OpenRouter)
3. Build dependency visualization
4. Add critical path analysis
5. Set up testing infrastructure (Playwright)

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for detailed weekly breakdown.

---

## 🐛 Known Issues

1. **Mind Map Canvas** - ReactFlow implementation needs verification
2. **AI Integration** - OpenRouter client not yet implemented
3. **RLS Policies** - Multi-tenant security not verified
4. **Testing** - Zero automated tests currently
5. **Billing** - Stripe integration not started

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
