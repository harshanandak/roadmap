# 📊 DATABASE SCHEMA

**Last Updated:** 2025-11-14
**Status:** Complete (24 migrations applied)

[← Back to Implementation Plan](README.md)

---

## Multi-Tenant Architecture

**Design Principles:**
- Every table has `team_id` for data isolation
- Row-Level Security (RLS) enforces access control
- Use timestamp-based TEXT IDs: `Date.now().toString()` (NOT UUID)
- Soft deletes preferred (add `deleted_at` column)

---

## Core Tables

### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **teams**
```sql
CREATE TABLE teams (
  id TEXT PRIMARY KEY, -- timestamp-based
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('free', 'pro')) DEFAULT 'free',
  member_count INT DEFAULT 1,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **team_members**
```sql
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

---

### **subscriptions**
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due'
  plan_id TEXT NOT NULL, -- 'pro'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Workspace Tables

### **workspaces**
```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phase TEXT CHECK (phase IN (
    'research', 'planning', 'review',
    'execution', 'testing', 'metrics', 'complete'
  )) DEFAULT 'research',
  enabled_modules JSONB DEFAULT '["research", "mind_map", "features"]'::jsonb,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '📊',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_team_id ON workspaces(team_id);
CREATE INDEX idx_workspaces_phase ON workspaces(phase);
```

---

## Feature Tables

### **features** (Modified)
```sql
-- Add team_id column to existing features table
ALTER TABLE features ADD COLUMN team_id TEXT REFERENCES teams(id);

-- Migrate existing data (assign to a default team)
-- UPDATE features SET team_id = 'default_team_id' WHERE team_id IS NULL;

-- Make team_id required after migration
ALTER TABLE features ALTER COLUMN team_id SET NOT NULL;

CREATE INDEX idx_features_team_id ON features(team_id);
```

---

### **timeline_items** (Modified)
```sql
ALTER TABLE timeline_items ADD COLUMN team_id TEXT REFERENCES teams(id);
CREATE INDEX idx_timeline_items_team_id ON timeline_items(team_id);
```

---

### **linked_items** (Modified)
```sql
ALTER TABLE linked_items ADD COLUMN team_id TEXT REFERENCES teams(id);
CREATE INDEX idx_linked_items_team_id ON linked_items(team_id);
```

---

## Mind Mapping Tables

### **mind_maps**
```sql
CREATE TABLE mind_maps (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  canvas_data JSONB NOT NULL, -- ReactFlow data structure
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mind_maps_workspace_id ON mind_maps(workspace_id);
```

---

### **mind_map_nodes**
```sql
CREATE TABLE mind_map_nodes (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT REFERENCES mind_maps(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN (
    'idea', 'feature', 'epic', 'module', 'user_story'
  )) NOT NULL,
  label TEXT NOT NULL,
  position JSONB NOT NULL, -- {x: number, y: number}
  data JSONB DEFAULT '{}'::jsonb, -- custom node data
  converted_to_feature_id TEXT, -- nullable, references features(id)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mind_map_nodes_mind_map_id ON mind_map_nodes(mind_map_id);
CREATE INDEX idx_mind_map_nodes_converted ON mind_map_nodes(converted_to_feature_id);
```

---

### **mind_map_edges**
```sql
CREATE TABLE mind_map_edges (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT REFERENCES mind_maps(id) ON DELETE CASCADE,
  source_node_id TEXT REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  target_node_id TEXT REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'default', -- 'default', 'dependency', 'relates'
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mind_map_edges_mind_map_id ON mind_map_edges(mind_map_id);
```

---

## Review & Feedback Tables

### **review_links**
```sql
CREATE TABLE review_links (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL, -- URL-safe random string
  type TEXT CHECK (type IN ('invite', 'public', 'embed')) NOT NULL,
  feature_ids JSONB NOT NULL, -- array of feature IDs to show
  settings JSONB DEFAULT '{
    "allow_comments": true,
    "allow_voting": true,
    "require_email": false
  }'::jsonb,
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_links_token ON review_links(token);
CREATE INDEX idx_review_links_workspace_id ON review_links(workspace_id);
```

---

### **feedback**
```sql
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  review_link_id TEXT REFERENCES review_links(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL, -- references features(id)
  reviewer_email TEXT, -- nullable if anonymous allowed
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status TEXT CHECK (status IN (
    'new', 'reviewed', 'implemented', 'rejected'
  )) DEFAULT 'new',
  attachments JSONB DEFAULT '[]'::jsonb, -- array of file URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_review_link_id ON feedback(review_link_id);
CREATE INDEX idx_feedback_feature_id ON feedback(feature_id);
CREATE INDEX idx_feedback_status ON feedback(status);
```

---

## Analytics Tables

### **custom_dashboards**
```sql
CREATE TABLE custom_dashboards (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout JSONB NOT NULL, -- widget positions and configs
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_dashboards_workspace_id ON custom_dashboards(workspace_id);
```

---

### **success_metrics**
```sql
CREATE TABLE success_metrics (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL, -- references features(id)
  metric_name TEXT NOT NULL,
  expected_value NUMERIC,
  actual_value NUMERIC,
  unit TEXT, -- 'users', 'percent', 'dollars', etc.
  measured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_success_metrics_feature_id ON success_metrics(feature_id);
```

---

## AI Usage Tracking

### **ai_usage**
```sql
CREATE TABLE ai_usage (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL, -- 'claude-haiku', 'perplexity', etc.
  message_count INT DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  month TEXT NOT NULL, -- 'YYYY-MM' format
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id, model, month)
);

CREATE INDEX idx_ai_usage_team_month ON ai_usage(team_id, month);
CREATE INDEX idx_ai_usage_user_month ON ai_usage(user_id, month);
```

---

## Row-Level Security (RLS) Policies

**Apply to all tables:**

```sql
-- Enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Users can read team features
CREATE POLICY "Users can read team features"
ON features FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Members can create team features
CREATE POLICY "Members can create team features"
ON features FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Members can update team features
CREATE POLICY "Members can update team features"
ON features FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Only owners/admins can delete
CREATE POLICY "Owners/admins can delete features"
ON features FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);
```

**Repeat similar policies for all tables.**

---

## Migration History

See [CHANGELOG.md](../../CHANGELOG.md) for complete migration history.

**Total Tables**: 20+
**Total Migrations**: 24 (as of 2025-11-14)
**RLS Policies**: Applied to all team-scoped tables

---

[← Back to Implementation Plan](README.md)
