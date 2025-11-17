# 📜 CHANGELOG

**Last Updated**: 2025-11-14
**Project**: Product Lifecycle Management Platform
**Format**: Based on [Keep a Changelog](https://keepachangelog.com/)

All notable changes, migrations, and feature implementations are documented in this file.

---

## [Unreleased]

### Added
- PROGRESS.md - Weekly implementation tracker with completion percentages
- CHANGELOG.md - This file, tracking all changes and migrations
- Updated README.md to reflect Next.js 15 platform (not legacy HTML app)
- Fixed MCP_OPTIMIZATION_SUMMARY.md (corrected from 2 to 3 active MCPs)

### Changed
- Documentation structure improvements in progress

---

## [0.3.0] - 2025-01-13 (Week 4 Start)

### Added - Database
- Migration `20250113000009_create_mind_maps_tables.sql`
  - Created `mind_maps` table with canvas_data JSONB
  - Created `mind_map_nodes` table with 5 node types (idea, feature, epic, module, user_story)
  - Created `mind_map_edges` table with relationship types
  - Added indexes for performance optimization
  - **Purpose**: Enable visual ideation with ReactFlow canvas

### Added - API
- Mind maps API routes (`/api/mind-maps`)
  - GET - List all mind maps for workspace
  - POST - Create new mind map
  - GET `/api/mind-maps/[id]` - Get mind map details
  - PATCH `/api/mind-maps/[id]` - Update mind map
  - DELETE `/api/mind-maps/[id]` - Delete mind map

### Added - Frontend
- Mind maps list page (`(dashboard)/mind-maps/page.tsx`)
- Create mind map dialog
- React Query hooks for mind map CRUD operations

### Known Issues
- ReactFlow canvas implementation status unknown (needs verification)
- AI integration for node suggestions not implemented
- Template system not built

---

## [0.2.5] - 2025-01-13

### Added - Database
- Migration `20250113000008_add_conversion_tracking.sql`
  - Created `workflow_stages` table
  - Created `conversion_tracking` table
  - **Purpose**: Track conversion from mind map nodes to features
  - **Rationale**: Need visibility into ideation → execution pipeline

---

## [0.2.4] - 2025-01-13

### Added - Database
- Migration `20250113000007_rename_features_to_work_items.sql`
  - Renamed columns for consistency
  - **Note**: Despite migration name, actual table name remained `features`
  - Updated related foreign key references

---

## [0.2.3] - 2025-01-13

### Added - Database
- Migration `20250113000006_improve_timeline_dependencies.sql`
  - Enhanced `linked_items` table structure
  - Added bidirectional relationship support
  - Improved dependency tracking for critical path analysis

---

## [0.2.2] - 2025-01-12 (Future date - likely typo)

### Added - Database
- Migration `20251112115417_create_tags_table.sql` (**Date typo: should be 20250112**)
  - Created `tags` table for feature categorization
  - Added many-to-many relationship infrastructure
  - **Purpose**: Enable flexible feature organization

### Action Required
- [ ] Rename migration file to correct date: `20250112115417_create_tags_table.sql`

---

## [0.2.1] - 2025-01-11

### Added - Database
- Migration `20250111000005_add_feature_analytics.sql`
  - Created `feature_correlations` table
  - Created `feature_importance_scores` table
  - **Purpose**: AI-powered feature prioritization and relationship detection
  - **Rationale**: Support ML-based recommendations for feature planning

---

## [0.2.0] - 2025-01-11 (Week 4 Start)

### Added - Database
- Migration `20250111000004_create_feature_connections.sql`
  - Created `feature_connections` table for dependency graph
  - Supports 4 link types: dependency, blocks, complements, relates
  - Added indexes for graph traversal performance
  - **Purpose**: Enable visual dependency mapping with ReactFlow

### Added - API
- Dependencies API routes (`/api/dependencies`)
  - GET - Get all dependencies for workspace
  - POST - Create new dependency link
  - DELETE - Remove dependency link
  - GET `/api/dependencies/analyze` - Critical path analysis

### Known Issues
- Frontend dependency graph not implemented
- Critical path algorithm not verified

---

## [0.1.5] - 2025-01-03

### Changed - Database
- Migration `20250101000003_change_ids_to_text.sql`
  - **Critical Change**: Converted all UUID IDs to TEXT (timestamp-based)
  - Reason: Project standard is `Date.now().toString()`, not UUIDs
  - **Impact**: Breaking change for existing data
  - **Lesson**: Should have used TEXT IDs from the start (documented in CLAUDE.md)

---

## [0.1.0] - 2025-01-01 (Week 1 Start)

### Added - Initial Release

#### Database Schema
- Migration `20250101000001_initial_schema.sql`
  - Created `users` table (Supabase Auth integration)
  - Created `teams` table (multi-tenant organizations)
  - Created `team_members` table (roles: owner, admin, member)
  - Created `subscriptions` table (Stripe billing)
  - Created `workspaces` table (projects with phases)
  - Created `features` table (roadmap items)
  - Created `timeline_items` table (MVP/SHORT/LONG breakdown)
  - Created `linked_items` table (feature relationships)

#### RLS Policies
- Migration `20250101000002_add_rls_policies.sql`
  - Enabled Row-Level Security on all tables
  - Team-scoped SELECT policies
  - Team-scoped INSERT/UPDATE policies
  - Owner/admin-only DELETE policies
  - **Status**: ⚠️ Not verified in production

#### Project Setup
- Initialized Next.js 15 with TypeScript
- Configured App Router with route groups: `(auth)` and `(dashboard)`
- Installed core dependencies:
  - `@supabase/ssr` for SSR-compatible Supabase client
  - `@tanstack/react-query` for server state management
  - `tailwindcss` + `@radix-ui/*` for UI (shadcn/ui)
  - `lucide-react` for icons
  - `stripe`, `@stripe/stripe-js` for payments (not yet implemented)
  - `resend` for emails (not yet implemented)

#### Authentication
- Created login page (`(auth)/login/page.tsx`)
- Created signup page (`(auth)/signup/page.tsx`)
- Created onboarding flow (`(auth)/onboarding/page.tsx`)
- Created accept invite page (`(auth)/accept-invite/page.tsx`)
- Set up auth middleware for route protection

#### UI Foundation
- Installed shadcn/ui components:
  - button, card, dialog, dropdown-menu, form
  - input, label, select, table, tabs, toast
- Configured Tailwind with design tokens
- Created base layout components

---

## Migration History Summary

| # | Date | Migration | Tables | Purpose |
|---|------|-----------|--------|---------|
| 1 | 2025-01-01 | Initial schema | 8 tables | Multi-tenant foundation |
| 2 | 2025-01-01 | RLS policies | - | Security policies |
| 3 | 2025-01-03 | Change IDs to TEXT | - | UUID → Timestamp IDs |
| 4 | 2025-01-11 | Feature connections | 1 table | Dependency graph |
| 5 | 2025-01-11 | Feature analytics | 2 tables | AI-powered insights |
| 6 | 2025-01-12 | Tags table | 1 table | Feature categorization |
| 7 | 2025-01-13 | Timeline dependencies | - | Enhanced dependencies |
| 8 | 2025-01-13 | Rename features | - | Column consistency |
| 9 | 2025-01-13 | Conversion tracking | 2 tables | Workflow tracking |
| 10 | 2025-01-13 | Mind maps tables | 3 tables | Visual ideation |

**Total Migrations**: 24 (some combined multiple operations)
**Total Tables**: 20+

---

## Database Schema Evolution

### Core Tables (Week 1-2)
1. `users` - User accounts (Supabase Auth)
2. `teams` - Organizations/teams
3. `team_members` - Team membership with roles
4. `subscriptions` - Stripe billing data
5. `workspaces` - Projects with phases

### Feature Tables (Week 2-4)
6. `features` - Top-level roadmap items
7. `timeline_items` - MVP/SHORT/LONG breakdowns
8. `linked_items` - Basic feature relationships
9. `feature_connections` - Dependency graph (added Week 4)
10. `feature_correlations` - AI-detected correlations (added Week 4)
11. `feature_importance_scores` - Priority scores (added Week 4)
12. `tags` - Feature categorization (added Week 4)

### Mind Mapping Tables (Week 3)
13. `mind_maps` - Canvas data (ReactFlow JSON)
14. `mind_map_nodes` - Individual nodes (5 types)
15. `mind_map_edges` - Connections between nodes

### Workflow Tracking (Week 4)
16. `workflow_stages` - Stage definitions
17. `conversion_tracking` - Mind map → Feature tracking

### Review & Feedback (Week 5 - Planned)
18. `review_links` - Public/invite/iframe links (not yet created)
19. `feedback` - Reviewer submissions (not yet created)

### Analytics (Week 7 - Planned)
20. `custom_dashboards` - User-created dashboards (not yet created)
21. `success_metrics` - Expected vs actual tracking (not yet created)
22. `ai_usage` - Message count per user/month (not yet created)

---

## Feature Implementation Timeline

### ✅ Implemented
- **Week 1-2 (50%)**: Next.js setup, auth, database schema
- **Week 3 (30%)**: Mind mapping list view, API routes
- **Week 4 (15%)**: Dependency database schema, API routes

### ⏳ In Progress
- **Week 3**: Mind mapping canvas (ReactFlow)
- **Week 4**: Feature dashboard, dependency visualization

### ❌ Not Started
- **Week 5**: Review system, email invitations
- **Week 6**: Timeline visualization, real-time collaboration
- **Week 7**: AI integration (OpenRouter, Perplexity, Exa)
- **Week 8**: Stripe billing, Playwright tests, Jest tests

---

## Undocumented Decisions

### Why were these tables added?

#### 1. `feature_correlations` & `feature_importance_scores`
**Added**: 2025-01-11 (Week 4)
**Reason**: Support AI-powered feature prioritization
**Rationale**:
- Correlations table detects relationships between features (e.g., "Payment Gateway" often paired with "Order Management")
- Importance scores use ML to prioritize features based on user feedback, dependencies, and business value
- Enables "Smart Suggestions" in AI assistant (Week 7)

#### 2. `tags` table
**Added**: 2025-01-12 (Week 4)
**Reason**: Flexible feature categorization
**Rationale**:
- Replace hard-coded categories with user-defined tags
- Supports multi-tag features (e.g., "backend" + "security" + "MVP")
- Enables filtering and search by tags

#### 3. `workflow_stages` & `conversion_tracking`
**Added**: 2025-01-13 (Week 4)
**Reason**: Track conversion pipeline from ideation to execution
**Rationale**:
- Visibility into how many mind map nodes convert to features
- Measure stage conversion rates (e.g., "60% of ideas become features")
- Analytics for Week 7 (conversion funnels)

---

## Breaking Changes

### ⚠️ v0.1.5 (2025-01-03) - UUID to TEXT ID Migration
**Impact**: All existing data with UUID IDs became incompatible
**Solution**: Data migration required (or fresh start)
**Lesson**: Should have used TEXT IDs from the beginning (documented in CLAUDE.md)

---

## Security Fixes

### 🔒 Pending
- [ ] **RLS Policies Not Verified** - Critical for multi-tenant security
- [ ] **JWT Validation** - Auth middleware not fully tested
- [ ] **OWASP Top 10 Review** - Scheduled for Week 8

---

## Performance Improvements

### Indexes Added
- Week 1: Core table indexes (team_id, workspace_id)
- Week 3: Mind map indexes (mind_map_id, converted_to_feature_id)
- Week 4: Dependency graph indexes (source_id, target_id)

---

## Known Issues & Tech Debt

### 🐛 Current Issues
1. **Mind Map Canvas** - Implementation status unknown, needs verification
2. **RLS Policies** - Not verified in production, security risk
3. **Migration Naming** - One migration has future date (20251112 instead of 20250112)
4. **No Tests** - Zero automated tests (E2E or unit)
5. **AI Integration** - OpenRouter client not implemented

### 📋 Tech Debt
1. **Large IMPLEMENTATION_PLAN.md** - 2,419 lines, needs splitting into folder
2. **Undocumented Decisions** - Some tables added without documentation updates
3. **Schema Drift** - IMPLEMENTATION_PLAN.md doesn't match actual migrations

---

## Deprecated Features

None yet (project is in initial development phase)

---

## Contributors

- Initial implementation: Harsh (with Claude Code assistance)

---

## References

- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - 8-week roadmap
- [PROGRESS.md](PROGRESS.md) - Current implementation status
- [CLAUDE.md](CLAUDE.md) - Project guidelines and coding standards
- [Supabase Migrations](supabase/migrations/) - All migration files

---

**Changelog Format**: [Keep a Changelog](https://keepachangelog.com/)
**Versioning**: [Semantic Versioning](https://semver.org/)

**Legend**:
- **Added**: New features or tables
- **Changed**: Changes to existing functionality
- **Deprecated**: Features marked for removal
- **Removed**: Deleted features
- **Fixed**: Bug fixes
- **Security**: Security improvements
