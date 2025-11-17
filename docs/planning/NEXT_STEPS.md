# 🎯 NEXT STEPS - Action Plan

**Last Updated**: 2025-11-14
**Current Week**: Week 3-4 (Mind Mapping & Dependencies)
**Overall Status**: ⚠️ Behind Schedule (25% complete, should be 50%)

---

## 🚨 IMMEDIATE ACTIONS (This Week - Week 4)

### Priority 1: Verify & Complete Mind Map Canvas

**Status**: ⚠️ **CRITICAL** - Implementation status unknown
**Time Estimate**: 4-8 hours
**Owner**: Development team

#### Tasks:
1. **Verify ReactFlow Canvas Implementation**
   ```bash
   # Check if canvas page exists and works
   cd next-app
   npm run dev
   # Navigate to /mind-maps/[id] and test functionality
   ```

2. **If Missing, Implement ReactFlow Canvas**
   - [ ] Install ReactFlow if not already: `npm install @xyflow/react`
   - [ ] Create custom node components (5 types):
     - IdeaNode (yellow, circular)
     - FeatureNode (blue, rounded rectangle)
     - EpicNode (purple, large rectangle)
     - ModuleNode (green, hexagon)
     - UserStoryNode (orange, card)
   - [ ] Implement node drag & drop
   - [ ] Implement edge creation (click source → click target)
   - [ ] Add canvas controls (zoom, pan, fit view, mini-map)
   - [ ] Add save canvas state to database
   - [ ] Add load canvas from database

3. **Test Critical Flows**
   - [ ] Create new mind map
   - [ ] Add nodes of each type
   - [ ] Connect nodes with edges
   - [ ] Save canvas
   - [ ] Reload and verify persistence

**Documentation**: See [MIND_MAP_ENHANCEMENTS.md](MIND_MAP_ENHANCEMENTS.md) for full feature list (23 enhancements postponed to Week 8+)

---

### Priority 2: Security Audit - Verify RLS Policies

**Status**: 🔴 **CRITICAL SECURITY RISK** - RLS not verified
**Time Estimate**: 2-4 hours
**Owner**: Security team / Backend developer

#### Tasks:
1. **Test Multi-Tenant Data Isolation**
   ```sql
   -- Connect as User A (Team 1)
   SELECT * FROM features WHERE team_id = 'team_1';
   -- Should only see Team 1 data

   -- Try to access Team 2 data (should fail)
   SELECT * FROM features WHERE team_id = 'team_2';
   -- Should return empty or error
   ```

2. **Verify RLS Policies on All Tables**
   - [ ] features
   - [ ] timeline_items
   - [ ] linked_items
   - [ ] mind_maps
   - [ ] mind_map_nodes
   - [ ] mind_map_edges
   - [ ] feature_connections
   - [ ] workspaces
   - [ ] teams
   - [ ] team_members

3. **Test Permission Levels**
   - [ ] Member can read team data
   - [ ] Member can create/update team data
   - [ ] Member CANNOT delete (only owner/admin)
   - [ ] Member CANNOT access other teams' data

4. **Document Findings**
   - Create `SECURITY_AUDIT_REPORT.md`
   - List all tested policies
   - Note any vulnerabilities found
   - Provide fix recommendations

**If Issues Found**: STOP all other work and fix RLS policies immediately. This is a data breach risk.

---

### Priority 3: Fix Migration Naming Typo

**Status**: 🟡 Minor Issue
**Time Estimate**: 5 minutes

#### Task:
```bash
cd supabase/migrations
# Rename the file with future date
mv 20251112115417_create_tags_table.sql 20250112115417_create_tags_table.sql
```

**Update Documentation**:
- [x] CHANGELOG.md already documents this issue
- [ ] Update PROGRESS.md to mark as fixed

---

### Priority 4: Create Feature Dashboard (Week 4)

**Status**: ⏳ In Progress
**Time Estimate**: 8-12 hours
**Owner**: Frontend developer

#### Tasks:
1. **Feature List Page**
   - [ ] Create `(dashboard)/features/page.tsx`
   - [ ] Fetch features with React Query (`useFeatures` hook)
   - [ ] Display features as cards with:
     - Feature name and purpose
     - Timeline breakdown (MVP/SHORT/LONG)
     - Tags
     - Dependency count
   - [ ] Add search and filter (by timeline, tags)

2. **Create Feature Modal**
   - [ ] Form with React Hook Form + Zod validation
   - [ ] Fields: name, purpose, type
   - [ ] Timeline items (dynamic array):
     - Add/remove timeline items
     - Fields: timeline (MVP/SHORT/LONG), difficulty, USP, integration_type
   - [ ] Submit to API (`POST /api/features`)

3. **Edit Feature Modal**
   - [ ] Load existing feature data
   - [ ] Same form as create, pre-populated
   - [ ] Submit to API (`PATCH /api/features/[id]`)

4. **Delete Feature**
   - [ ] Confirmation dialog
   - [ ] Check for dependencies before delete
   - [ ] Soft delete (add `deleted_at` column)

**API Routes to Verify/Create:**
- [ ] `GET /api/features` - List all features
- [ ] `POST /api/features` - Create feature
- [ ] `GET /api/features/[id]` - Get feature details
- [ ] `PATCH /api/features/[id]` - Update feature
- [ ] `DELETE /api/features/[id]` - Delete feature

---

## 📅 SHORT-TERM PRIORITIES (Next 2 Weeks)

### Week 4 Completion (Target: 2025-11-21)

#### 1. Dependency Visualization (8-12 hours)
- [ ] **ReactFlow Dependency Graph**
  - Create `(dashboard)/dependencies/page.tsx`
  - Load features with dependencies
  - Render as ReactFlow graph
  - 4 edge types (dependency, blocks, complements, relates)
  - Color-coded edges
  - Interactive node selection

- [ ] **Critical Path Analysis**
  - Implement longest path algorithm
  - Highlight critical path in red
  - Show estimated completion time
  - Display bottlenecks

- [ ] **Dependency Management UI**
  - Add dependency button on feature cards
  - Select feature to link to
  - Choose link type
  - Save to `feature_connections` table

#### 2. Testing Infrastructure Setup (4-6 hours)
- [ ] **Install Playwright**
  ```bash
  npm init playwright@latest
  ```

- [ ] **Create Critical E2E Tests**
  - Test 1: Authentication flow (signup → login → dashboard)
  - Test 2: Create mind map → add nodes → save
  - Test 3: Create feature → add timeline items → save
  - Test 4: Create dependency link → verify graph
  - Test 5: Multi-tenant isolation (User A can't see User B's data)

- [ ] **Set Up Jest for Unit Tests**
  ```bash
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom
  ```
  - Test React components
  - Test utility functions
  - Test API route handlers

#### 3. Complete Week 3 (Mind Mapping) (12-16 hours)
- [ ] **AI Integration for Node Suggestions**
  - Set up OpenRouter API client (Week 7 dependency - fast-track)
  - Implement "Suggest Related Nodes" feature
  - Implement "Auto-connect Nodes" based on content

- [ ] **Template System**
  - Create 3 pre-built templates:
    - SaaS Product
    - Mobile App
    - API Platform
  - Template preview modal
  - Apply template to canvas (populate nodes)

- [ ] **Export & Import**
  - Export canvas to JSON
  - Import canvas from JSON
  - Export canvas as PNG (screenshot)
  - Export as Markdown (text representation)

- [ ] **Convert to Features Workflow**
  - Select nodes on canvas
  - "Convert to Feature" button
  - Map node properties to feature properties
  - Create features in batch
  - Maintain relationships (edges → dependencies)

---

## 🎯 STRATEGIC PRIORITIES (Next 4 Weeks)

### Decision Point: Timeline Re-baseline

**Current Situation**: 25% complete, should be 50%
**Options**:

#### Option A: Accept 12-Week Timeline ✅ **RECOMMENDED**
- **New Target**: 2025-04-19 (12 weeks from start)
- **Reasoning**: More realistic given current velocity
- **Impact**:
  - Reduces stress and burnout risk
  - Allows proper testing and quality assurance
  - Time for security audit and performance optimization

#### Option B: Reduce Scope to Hit 8-Week Deadline
- **Cut Features**: Remove Review System (Week 5), some AI features (Week 7)
- **Launch MVP Only**: Mind mapping + Features + Basic AI
- **Impact**:
  - Faster to market
  - Missing key differentiators (review system, agentic AI)
  - Tech debt and rushed quality

#### Option C: Parallel Workstreams (Risky)
- **Strategy**: Work on multiple weeks simultaneously
- **Example**: Week 4 (Dependencies) + Week 7 (AI) in parallel
- **Impact**:
  - Could catch up to timeline
  - High risk of bugs and integration issues
  - Requires more developers

**Recommendation**: **Option A** - Accept 12-week timeline, focus on quality

---

### Fast-Track AI Integration (Week 7 → Week 5-6)

**Rationale**: AI is the core differentiator, should be prioritized

#### Tasks (Week 5-6 Work):
1. **OpenRouter API Client** (4-6 hours)
   - Set up API client wrapper
   - Implement streaming support
   - Add error handling and retries
   - Test with Claude Haiku model

2. **AI Chat Panel (Basic)** (8-12 hours)
   - Create left sidebar chat component
   - Message history (local state or Supabase)
   - Send message → receive streaming response
   - Context injection (workspace, features)

3. **3 Essential AI Tools** (8-12 hours)
   - Tool 1: Create Feature (agentic mode)
   - Tool 2: Suggest Dependencies (analysis)
   - Tool 3: Search Features (query)

4. **AI Usage Tracking** (4-6 hours)
   - Track messages per user/month
   - Enforce limits (500 Free, 1000 Pro)
   - Display usage in UI

**Total Time**: 24-36 hours (3-4.5 days)
**Target**: Complete by end of Week 6

---

### Implement Billing (Week 8 → Week 6-7)

**Rationale**: Need revenue stream before launch

#### Tasks:
1. **Stripe Checkout** (6-8 hours)
   - Create checkout session API route
   - Redirect to Stripe Checkout
   - Handle success/cancel callbacks
   - Update subscription status in database

2. **Stripe Webhooks** (4-6 hours)
   - Webhook endpoint (`/api/webhooks/stripe`)
   - Handle events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Update `subscriptions` table
   - Update `teams.plan` column

3. **Feature Gates** (4-6 hours)
   - Check user's plan before accessing Pro features
   - Show upgrade modal for Free users
   - Enforce limits (5 users on Free tier)

4. **Customer Portal** (2-4 hours)
   - Link to Stripe Customer Portal
   - Allow subscription management
   - Invoice history

**Total Time**: 16-24 hours (2-3 days)
**Target**: Complete by end of Week 7

---

## 📋 MEDIUM-TERM PRIORITIES (Week 5-8)

### Week 5: Review System (If Timeline Permits)
- Public review links
- Email invitations (Resend)
- Feedback submission forms
- iframe embeds (Pro tier)

**Alternative**: Postpone to post-launch (v1.1)

---

### Week 6: Timeline Visualization
- Gantt chart (react-big-calendar or custom)
- Drag-to-reschedule
- Dependency arrows
- Team assignment

---

### Week 7: Complete AI Integration
- Full agentic mode (20+ tools)
- Research & Discovery (Perplexity, Exa)
- Custom analytics dashboards
- AI usage tracking dashboard

---

### Week 8: Testing & Launch
- Comprehensive E2E tests (Playwright)
- Unit tests (Jest)
- Security audit
- Performance optimization
- Production deployment checklist

---

## 🛠️ DOCUMENTATION IMPROVEMENTS

### Immediate (This Week)
- [x] Create PROGRESS.md ✅
- [x] Create CHANGELOG.md ✅
- [x] Create NEXT_STEPS.md ✅ (this file)
- [ ] Create REVISED_TIMELINE.md (12-week plan)
- [ ] Create ARCHITECTURE.md (system diagrams)
- [ ] Create API_REFERENCE.md (20+ routes)

### This Sprint
- [ ] **Restructure IMPLEMENTATION_PLAN.md** into folder:
  ```
  docs/implementation/
  ├── README.md
  ├── week-1-2-foundation.md
  ├── week-3-mind-mapping.md
  ├── week-4-dependencies.md
  ├── week-5-review-system.md
  ├── week-6-timeline-execution.md
  ├── week-7-ai-analytics.md
  ├── week-8-billing-testing.md
  ├── database-schema.md
  └── postponed-features.md
  ```
  **Benefit**: 83% token savings when loading specific weeks

- [ ] **Update CLAUDE.md**
  - Add documentation maintenance workflow
  - Add links to new documentation (PROGRESS.md, CHANGELOG.md, NEXT_STEPS.md)
  - Update current state section

- [ ] **Create DOCUMENTATION_AUDIT_CHECKLIST.md**
  - Weekly/monthly sync process
  - Cross-reference validation
  - Consistency checks

---

## 🚦 BLOCKER RESOLUTION

### Blocker 1: ReactFlow Canvas Unknown
**Impact**: Can't proceed with mind map enhancements
**Resolution**: Verify implementation this week (Priority 1)
**Owner**: Frontend developer

### Blocker 2: RLS Policies Not Verified
**Impact**: Security risk, data breach potential
**Resolution**: Security audit this week (Priority 2)
**Owner**: Backend developer / Security team

### Blocker 3: No AI Integration
**Impact**: Core differentiator missing
**Resolution**: Fast-track to Week 5-6 (Strategic Priority)
**Owner**: AI/Backend developer

### Blocker 4: No Billing
**Impact**: No revenue stream
**Resolution**: Fast-track to Week 6-7 (Strategic Priority)
**Owner**: Backend developer

---

## 📊 SUCCESS METRICS

### Week 4 Goals (End of Week)
- [ ] Mind map canvas verified and working (100%)
- [ ] RLS policies verified (100%)
- [ ] Feature dashboard implemented (100%)
- [ ] Dependency graph implemented (100%)
- [ ] 5+ E2E tests passing
- [ ] Migration naming fixed
- [ ] Progress: 40% → 50%

### Month 1 Goals (End of Week 6)
- [ ] Week 1-4 complete (100%)
- [ ] Basic AI chat panel working
- [ ] Stripe checkout implemented
- [ ] 20+ E2E tests passing
- [ ] Progress: 50% → 65%

### Launch Readiness (End of Week 12)
- [ ] All core features complete
- [ ] Security audit passed
- [ ] 50+ E2E tests passing
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] Progress: 100%

---

## 📞 SUPPORT & ESCALATION

### Questions?
- Check [CLAUDE.md](CLAUDE.md) for project guidelines
- See [PROGRESS.md](PROGRESS.md) for current status
- See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for detailed roadmap

### Issues?
- Security concerns: Escalate immediately
- Timeline slippage: Review priorities with team
- Technical blockers: Use recommended Claude agents (see [RECOMMENDED_AGENTS.md](RECOMMENDED_AGENTS.md))

---

## 🎯 TL;DR - This Week's Focus

1. **Verify mind map canvas** (4-8 hours) - CRITICAL
2. **Security audit (RLS)** (2-4 hours) - CRITICAL
3. **Build feature dashboard** (8-12 hours)
4. **Set up testing** (4-6 hours)
5. **Fix migration naming** (5 min)

**Total Estimated Time**: 18-30 hours (2.5-4 days)

**End of Week Target**: 50% complete (up from 25%)

---

**Last Updated**: 2025-11-14
**Next Review**: 2025-11-21 (Weekly)
