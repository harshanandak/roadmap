# **WEEK 3: Mind Mapping** **[CRITICAL FEATURE]**

**Last Updated:** 2025-11-14
**Status:** ⏳ In Progress (30% complete)

[← Previous: Week 1-2](week-1-2-foundation.md) | [Back to Plan](README.md) | [Next: Week 4 →](week-4-dependencies.md)

---

## Goal
Visual canvas with AI-powered suggestions

---

## Module Overview

### **Purpose:** Visual ideation, brainstorming, connecting concepts

### **Technology:** ReactFlow (React-based node graph library)

### Node Types (5 Total):
1. **💡 Idea Node** - Early-stage concept, free-form
2. **📋 Feature Node** - Structured feature (can convert from Idea)
3. **🎯 Epic Node** - Collection of features (high-level)
4. **📦 Module Node** - Technical component (backend service, API)
5. **👤 User Story Node** - User-focused narrative ("As a user, I want...")

---

## Tasks

### Day 1-2: ReactFlow Setup
- [ ] Install ReactFlow:
  ```bash
  npm install reactflow
  ```
- [ ] Create mind map page: `/app/(dashboard)/mindmap/page.tsx`
- [ ] Build canvas component: `components/mindmap/mind-map-canvas.tsx`
- [ ] Implement basic drag-and-drop
- [ ] Add zoom/pan controls

### Day 3-5: Node Types
- [ ] Create 5 custom node components:
  - [ ] `components/mindmap/node-types/idea-node.tsx` (💡)
  - [ ] `components/mindmap/node-types/feature-node.tsx` (📋)
  - [ ] `components/mindmap/node-types/epic-node.tsx` (🎯)
  - [ ] `components/mindmap/node-types/module-node.tsx` (📦)
  - [ ] `components/mindmap/node-types/user-story-node.tsx` (👤)
- [ ] Style nodes (different colors, icons)
- [ ] Add inline editing (double-click to edit label)

### Day 6-8: AI Integration
- [ ] "Generate mind map from text" tool
  - [ ] Modal to paste text
  - [ ] Call Claude Haiku with prompt
  - [ ] Parse response → create nodes
- [ ] "Suggest connections" tool
  - [ ] Analyze all nodes semantically
  - [ ] Draw edges between related nodes
- [ ] "Cluster similar ideas" tool
  - [ ] Group related nodes
  - [ ] Create Epic nodes as parents
- [ ] "Expand node" context menu
  - [ ] Right-click → "AI Expand"
  - [ ] Generate 3-5 child nodes

### Day 9-10: Convert to Features
- [ ] **Critical workflow:** Right-click node → "Convert to Feature"
- [ ] AI transforms node data → feature object:
  ```typescript
  {
    name: node.label,
    type: 'Feature',
    purpose: node.data.description,
    timelineItems: [
      { timeline: 'MVP', usp: 'Basic version', difficulty: 'Medium' }
    ]
  }
  ```
- [ ] Insert into `features` table
- [ ] Update `mind_map_nodes.converted_to_feature_id`
- [ ] Show success toast
- [ ] Link back (feature detail shows mind map origin)

### Day 11-12: Templates & Polish
- [ ] Create 5 templates:
  - [ ] SaaS Product Roadmap
  - [ ] Mobile App Development
  - [ ] Web Platform Architecture
  - [ ] Marketing Campaign
  - [ ] E-commerce Store
- [ ] Template modal (choose on new map)
- [ ] Auto-layout algorithm (organize nodes cleanly)

### Day 13-14: Real-time & Export
- [ ] Real-time collaboration (Supabase Realtime)
  - [ ] Live cursors (see teammates)
  - [ ] Presence indicators
- [ ] Export mind map:
  - [ ] PNG (canvas to image)
  - [ ] SVG (ReactFlow built-in)
  - [ ] JSON (for backup/sharing)
- [ ] Save/load functionality

---

## Core Functionality

### Canvas Controls
- **Drag-and-drop nodes** - Intuitive positioning
- **Connect nodes** - Draw relationships (edges)
- **Auto-layout** - AI organizes messy maps into clean layouts
- **Zoom/pan controls** - Navigate large maps
- **Collaborative editing** - Real-time cursors, see teammates

### AI Integration (What Makes This Special)

1. **"Generate mind map from text"**
   - User pastes vision document or feature list
   - AI parses and creates structured mind map
   - Automatically chooses appropriate node types
   - Links related concepts

2. **"Suggest connections"**
   - AI analyzes node descriptions (semantic understanding)
   - Automatically draws edges between related nodes
   - Explains relationship in edge label

3. **"Cluster similar ideas"**
   - AI groups related nodes
   - Creates hierarchical structure
   - Suggests Epic nodes to group features

4. **"Expand node"**
   - Right-click on node → "AI Expand"
   - AI generates 3-5 sub-nodes
   - Example: "Social Features" → ["Follow users", "Like posts", "Comments", "Share content"]

5. **"Fill knowledge gaps"**
   - AI analyzes entire mind map
   - Suggests missing components
   - Example: "You have frontend features but no backend API nodes"

---

## **Critical Workflow: Convert to Features**

**The Magic Moment:**
1. User creates mind map with ideas
2. Right-click on node(s) → **"Convert to Feature"**
3. AI transforms node into structured feature:
   - Takes node title → Feature name
   - Takes node description → Feature purpose
   - Suggests timeline breakdown (MVP/SHORT/LONG)
   - Estimates difficulty
   - Adds categories based on node type
4. Feature appears in Feature List with reference back to mind map node

**UI Location:** Dedicated view (`/workspace/[id]/mindmap`)

**This is the #1 innovation** - bridges visual ideation with structured project management.

---

## Deliverables

✅ Fully functional mind map canvas
✅ 5 node types with custom styling
✅ AI: generate, cluster, suggest, expand
✅ Convert nodes to features (THE KEY FEATURE)
✅ 5 templates for quick start
✅ Real-time collaboration
✅ Export (PNG, SVG, JSON)

---

## Testing

- [ ] Create mind map from blank canvas
- [ ] Add 10+ nodes of different types
- [ ] Use AI to suggest connections
- [ ] Cluster similar nodes
- [ ] Convert 5 nodes to features
- [ ] Verify features appear in feature list
- [ ] Export as PNG and verify image
- [ ] Open in 2 browser tabs, verify real-time updates

---

## Postponed Enhancements

23 mind map enhancements have been postponed to Week 9-10 (post-core platform). See [postponed-features.md](postponed-features.md) for details.

**Postponed features include:**
- Auto-zoom, focus mode, undo/redo
- Version history, comments on nodes
- Node dependencies on canvas
- AI-powered node suggestions
- Smart clustering, gap analysis

**Why postponed:** These enhancements depend on modules built in Weeks 4-7 (Dependencies, Timeline, AI). Core mind mapping (Week 3) already delivers 80% of value.

---

[← Previous: Week 1-2](week-1-2-foundation.md) | [Back to Plan](README.md) | [Next: Week 4 →](week-4-dependencies.md)
