# 🔄 POSTPONED FEATURES

**Last Updated:** 2025-11-14
**Purpose:** Track features planned but deferred for strategic reasons

[← Back to Implementation Plan](README.md)

---

## Policy

This document follows the [Tracking Postponed Features Policy](../../CLAUDE.md#tracking-postponed-features) defined in CLAUDE.md.

**Every postponed feature entry MUST include:**
- What was postponed (brief summary + link to detailed doc)
- Postponed date (when decision was made)
- Reason (strategic rationale with specific dependencies)
- Dependencies (what needs to be completed first, with checkboxes)
- Priority (High/Medium/Low)
- Estimated effort (time estimate when resumed)
- When to implement (specific milestone or phase trigger)
- Review trigger (when to revisit this decision)
- Rationale (detailed explanation)

---

## Mind Map Enhancements (23 features across 3 phases)

**📅 Postponed Date:** January 13, 2025

**🎯 Priority:** Medium (not critical for launch, but valuable for user experience)

**⏱️ Estimated Effort:** 3-4 weeks (after Week 7 completion)

**📋 Full Details:** See [MIND_MAP_ENHANCEMENTS.md](../postponed/MIND_MAP_ENHANCEMENTS.md)

---

### **Why Postponed**

Core mind mapping functionality (Week 3) delivers the essential value:
- Visual canvas with drag-and-drop
- 5 node types (Idea, Feature, Epic, Module, User Story)
- Basic AI integration (generate, cluster, suggest, expand)
- **Convert nodes to features** (THE KEY FEATURE)
- Real-time collaboration
- Export (PNG, SVG, JSON)

**The 23 postponed enhancements** are UX improvements and advanced features that depend on modules built in Weeks 4-7. Implementing them now would:
- ❌ Require premature integration with incomplete modules
- ❌ Risk rework when dependencies change
- ❌ Delay critical platform features (dependencies, review, AI)
- ❌ Create maintenance burden for incomplete features

---

### **Dependencies (Must Complete First)**

- [✅] **Week 2-3:** Features module - Data structure for nodes *(COMPLETED)*
- [✅] **Week 4:** Dependencies module - For showing dependencies on canvas *(COMPLETED)*
- [⏳] **Week 5:** Review & Feedback module - For filtering nodes by review status
- [⏳] **Week 6:** Timeline & Execution module - For phase-based visualization and status indicators
- [⏳] **Week 7:** AI Integration & Analytics - For AI-powered node suggestions and smart clustering
- [⏳] **Week 8:** Testing infrastructure - For E2E tests of enhanced features

---

### **Summary of Postponed Features**

#### **Phase 1: Core Interactions (1 week)**
1. Auto-zoom to fit selected nodes
2. Focus mode (dim non-selected nodes, spotlight selection)
3. Compact view toggle (smaller nodes for large maps)
4. Undo/redo (10 actions, Ctrl+Z/Ctrl+Y)
5. Keyboard shortcuts (Delete, Ctrl+C/V, Arrow keys)
6. Node search/filter (by name, type, status)

#### **Phase 2: Advanced Features (1.5 weeks)**
7. Version history (snapshot canvas states, restore previous versions)
8. Comments on nodes (team discussions per node)
9. Node dependencies on canvas (visual arrows between nodes)
10. Custom node colors and icons (personalization)
11. Batch operations (select multiple nodes → bulk edit)
12. Node status indicators (badges for blocked, in-progress, done)
13. Link nodes to features (bidirectional references)
14. Show feature metrics on nodes (timeline, difficulty, assignee)
15. Filter by phase (MVP/SHORT/LONG color coding)

#### **Phase 3: AI-Powered Enhancements (1.5 weeks)**
16. AI-powered node suggestions ("Add complementary features")
17. Smart clustering (ML-based similarity grouping)
18. Auto-organize layout (force-directed graph algorithm)
19. Dependency validation (warn about circular dependencies)
20. Gap analysis ("Missing backend API nodes")
21. Priority recommendations (highlight critical path)
22. Template generation from existing maps (save custom templates)
23. Natural language canvas queries ("Show all mobile features")

---

### **When to Implement**

**Target:** After completing **Week 7** (AI Integration & Analytics module)

**Why then:**
- ✅ All required dependencies will be complete
- ✅ AI infrastructure ready for advanced features
- ✅ Timeline module provides phase/status data
- ✅ Dependencies module provides graph algorithms
- ✅ Review module provides feedback integration
- ✅ Testing infrastructure ready for E2E tests

**Ideal timing:** Between Week 7 completion and Week 8 (Billing & Testing), or as Week 9-10 post-launch polish.

---

### **Review Trigger**

**When:** End of Week 7 (AI Integration & Analytics complete)

**Who:** Product team + 2 beta users

**Questions to ask:**
1. Are users requesting these enhancements? (Check feedback)
2. Are all dependencies stable? (No schema changes expected)
3. Is core platform feature-complete? (All 10 modules working)
4. Do we have 3-4 weeks before launch deadline?
5. Would delaying launch for these features improve success rate?

**Decision matrix:**
- If "YES" to all 5: ✅ **PROCEED** with implementation (Week 9-10)
- If "NO" to question 4-5: ⏸️ **POSTPONE** to post-launch (Month 2-3)
- If "NO" to question 1: 🔍 **RE-EVALUATE** priority based on user feedback

---

### **Detailed Rationale**

**Why these features are valuable:**
- **Better UX:** Focus mode, undo/redo, keyboard shortcuts improve productivity
- **Power users:** Batch operations, version history, custom colors enable advanced workflows
- **Integration:** Node dependencies, feature metrics, status indicators connect mind maps to other modules
- **AI leverage:** Smart clustering, gap analysis, priority recommendations showcase platform intelligence

**Why postponing is the right decision:**

1. **Data dependencies:**
   - Phase-based visualization needs Timeline module (Week 6)
   - Status indicators need Execution module (Week 6)
   - Feature metrics need Analytics module (Week 7)
   - Dependency visualization needs Dependencies module (Week 4)

2. **Integration complexity:**
   - "Link nodes to features" requires stable feature schema
   - "Show feature metrics on nodes" needs analytics calculations
   - "Filter by review status" needs Review module API
   - Implementing now = high risk of rework when dependencies evolve

3. **Strategic timing:**
   - Core mind mapping (Week 3) already delivers 80% of value
   - Convert nodes to features (THE KEY WORKFLOW) is complete
   - These enhancements are "nice-to-have" polish, not blockers
   - Launch users will provide real feedback on which enhancements matter most

4. **Resource allocation:**
   - 3-4 weeks of dev time is significant
   - Better spent on Review system (Week 5), Timeline (Week 6), AI (Week 7)
   - Can revisit post-launch based on actual user demand

5. **Testing feasibility:**
   - Advanced features need stable platform for testing
   - E2E tests for mind map enhancements require:
     - Features module working
     - Dependencies module working
     - Timeline module working
   - Testing incomplete features = wasted effort when schemas change

**Alternative considered:** "Build a subset now (Phase 1 only)"
- **Rejected because:** Would still require integration work, and Phase 1 alone doesn't provide enough value to justify delaying other modules. Better to complete Weeks 4-7 first, then do all 3 phases together when dependencies are stable.

---

**Last Reviewed:** January 13, 2025
**Next Review:** End of Week 7 (estimated: March 1-7, 2025)

---

## Workspace-Level Timelines & Calculated Status (Architecture Refactor)

**📅 Postponed Date:** December 1, 2025

**🎯 Priority:** HIGH (Foundation for future features)

**⏱️ Estimated Effort:** ~25 hours (after 8-tab implementation)

**📋 Full Details:** See [WORKSPACE_TIMELINE_ARCHITECTURE.md](../postponed/WORKSPACE_TIMELINE_ARCHITECTURE.md)

---

### **Why Postponed**

Current 8-tab Work Item Detail Page implementation delivers immediate value. Architecture refactor:
- ❌ Would require reworking in-progress components
- ❌ Needs full platform stabilization first
- ✅ Can be implemented as non-breaking change (new tables alongside existing)

---

### **Dependencies (Must Complete First)**

- [⏳] Work Item Detail Page 8-tab structure
- [⏳] Resources Tab integration
- [⏳] Feedback Tab integration
- [⏳] Current timeline_items system stable
- [⏳] AI Integration complete (Week 7)

---

### **When to Implement**

**Target:** After Week 7 completion (AI Integration)

**Why then:**
- ✅ All required dependencies will be complete
- ✅ 8-tab Work Item Detail Page stable
- ✅ Current timeline system has been tested in production
- ✅ Can add new structure alongside old (non-breaking)

---

### **Summary of Changes**

#### Database (4 changes)
1. NEW: `timelines` table - Workspace-level release milestones
2. NEW: `work_item_timelines` junction table - M:N work items ↔ timelines
3. MODIFY: `product_tasks` - Add `effort_size` (xs/s/m/l/xl) with computed `effort_points`
4. MODIFY: `workspaces` - Add `effort_vocabulary` (simple/technical/business)

#### Conceptual (4 changes)
1. Work item STATUS becomes CALCULATED from task progress
2. Phase remains INTERNAL (for tab visibility logic only)
3. Timelines move from per-work-item to workspace level
4. Effort uses T-shirt vocabulary with Fibonacci points (1/2/5/8/13)

#### API (7 new endpoints)
1. `GET/POST /api/workspaces/[id]/timelines` - List/create timelines
2. `PATCH/DELETE /api/timelines/[id]` - Update/delete timeline
3. `GET /api/timelines/[id]/work-items` - Work items in timeline
4. `POST/DELETE /api/work-items/[id]/timelines` - Add/remove from timeline

#### UI (3 major updates)
1. NEW: Workspace Timeline Management page
2. UPDATE: Scope Tab - Shows timeline assignments
3. UPDATE: Tasks Tab - Effort size selector (XS/S/M/L/XL)

---

### **Review Trigger**

**When:** End of Week 7 (AI Integration & Analytics complete)

**Questions to ask:**
1. Is the 8-tab Work Item Detail Page stable?
2. Are all current API endpoints working correctly?
3. Is there user feedback requesting timeline improvements?
4. Do we have ~25 hours available before next major milestone?
5. Would this refactor improve the Gantt/Timeline views significantly?

**Decision matrix:**
- If "YES" to all 5: ✅ **PROCEED** with implementation
- If "NO" to question 4: ⏸️ **POSTPONE** further
- If "NO" to question 5: 🔍 **RE-EVALUATE** priority

---

**Last Reviewed:** December 1, 2025
**Next Review:** End of Week 7 (AI Integration complete)

---

[← Back to Implementation Plan](README.md)
