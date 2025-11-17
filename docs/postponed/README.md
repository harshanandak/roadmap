# 🔄 Postponed Features

**Last Updated:** 2025-11-14

[← Back to Root](../../README.md)

---

## 📋 WHAT ARE POSTPONED FEATURES?

Features that were planned but **strategically deferred** to later phases due to:
- Dependencies on modules not yet built
- Risk of rework when dependencies change
- Better timing after platform stabilizes
- Resource allocation priorities

**Important:** Postponed ≠ Canceled. These features will be implemented when dependencies are ready.

---

## 📄 DOCUMENTS IN THIS FOLDER

### **[MIND_MAP_ENHANCEMENTS.md](MIND_MAP_ENHANCEMENTS.md)**
23 mind map enhancement features across 3 phases (UX improvements + AI-powered features)

**📅 Postponed Date:** January 13, 2025

**🎯 Priority:** Medium (valuable but not critical for launch)

**⏱️ Estimated Effort:** 3-4 weeks

**Dependencies:**
- [✅] Week 2-3: Features module (COMPLETED)
- [✅] Week 4: Dependencies module (COMPLETED)
- [⏳] Week 5: Review & Feedback module
- [⏳] Week 6: Timeline & Execution module
- [⏳] Week 7: AI Integration & Analytics
- [⏳] Week 8: Testing infrastructure

**Summary of Features:**

#### Phase 1: Core Interactions (1 week)
1. Auto-zoom to fit selected nodes
2. Focus mode (dim non-selected nodes)
3. Compact view toggle
4. Undo/redo (10 actions, Ctrl+Z/Y)
5. Keyboard shortcuts (Delete, Ctrl+C/V, arrows)
6. Node search/filter

#### Phase 2: Advanced Features (1.5 weeks)
7. Version history (snapshot canvas states)
8. Comments on nodes (team discussions)
9. Node dependencies on canvas (visual arrows)
10. Custom node colors and icons
11. Batch operations (select multiple → bulk edit)
12. Node status indicators (blocked, in-progress, done)
13. Link nodes to features (bidirectional references)
14. Show feature metrics on nodes
15. Filter by phase (MVP/SHORT/LONG color coding)

#### Phase 3: AI-Powered Enhancements (1.5 weeks)
16. AI-powered node suggestions
17. Smart clustering (ML-based similarity)
18. Auto-organize layout (force-directed graph)
19. Dependency validation (warn about circular deps)
20. Gap analysis ("Missing backend API nodes")
21. Priority recommendations (highlight critical path)
22. Template generation from existing maps
23. Natural language canvas queries

**When to Implement:** After Week 7 (AI Integration complete)

**Review Trigger:** End of Week 7

---

## 🔄 POSTPONED FEATURES POLICY

All postponed features follow the policy defined in [CLAUDE.md](../../CLAUDE.md#tracking-postponed-features).

**Every postponed feature entry MUST include:**
- ✅ What was postponed (brief summary + link)
- ✅ Postponed date
- ✅ Reason (strategic rationale with dependencies)
- ✅ Dependencies (checkboxes for tracking)
- ✅ Priority (High/Medium/Low)
- ✅ Estimated effort
- ✅ When to implement (specific milestone)
- ✅ Review trigger (when to revisit)
- ✅ Detailed rationale

---

## 📋 HOW TO ADD NEW POSTPONED FEATURES

1. **Create detailed specification file** in this folder: `[FEATURE_NAME].md`
2. **Add entry to** [docs/implementation/postponed-features.md](../implementation/postponed-features.md)
3. **Follow the template** defined in CLAUDE.md
4. **Set review trigger** (when to revisit the decision)
5. **Update CHANGELOG.md** with postponement decision

---

## 🔗 RELATED DOCUMENTATION

- **[Implementation Plan - Postponed Features](../implementation/postponed-features.md)** - Summary tracking
- **[CLAUDE.md - Postponed Features Policy](../../CLAUDE.md#tracking-postponed-features)** - Policy and template
- **[Planning Documents](../planning/README.md)** - Current priorities
- **[NEXT_STEPS.md](../planning/NEXT_STEPS.md)** - Immediate action items

---

## 📊 POSTPONEMENT DECISION FRAMEWORK

### 5-Question Framework (Before Implementation)

1. **Data Dependencies:** Does this feature depend on data from other modules?
2. **Integration Points:** Will this integrate with other modules' APIs?
3. **User Experience Flow:** Does this make sense at this point in user journey?
4. **Database Schema Stability:** Does this depend on specific tables/columns?
5. **Testing Feasibility:** Can this be fully tested with currently available data?

**If ANY question reveals blocking dependencies → POSTPONE**

**See:** [CLAUDE.md - Execution Timing](../../CLAUDE.md#execution-timing--dependency-cross-checks)

---

[← Back to Root](../../README.md)
