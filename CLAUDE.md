# Project Guidelines

## General Instructions
- Always use higher timeouts (60000ms+) for downloads and long-running commands
- Prefer concise explanations unless detailed documentation is requested
- Follow test-driven development when appropriate

## Code Style
- Use clear, descriptive variable names
- Add comments for complex logic
- Prefer modern ES6+ syntax for JavaScript

## Performance
- Optimize for performance and readability
- Minimize dependencies where possible

## Testing
- Write tests for new features
- Run tests before marking tasks complete

## Git Workflow
- Write clear, descriptive commit messages
- Follow conventional commits format when possible

---

## Project Architecture

### Workspace System
- **Multi-workspace support**: Users can create multiple independent roadmap projects
- **Data isolation**: Each workspace has completely separate features, AI context, and settings
- **Workspace properties**: id, name, description, color (hex), icon (emoji), customInstructions, aiMemory
- **No cross-workspace references**: Features and links are confined to their workspace

### Database Structure (Supabase)
- **Primary tables**: `workspaces`, `features`, `timeline_items`, `linked_items`, `user_settings`
- **ID format**: Timestamp-based TEXT IDs (not UUID) - use `Date.now().toString()`
- **Workspace filtering**: All data queries must filter by `workspace_id`
- **User isolation**: All tables have `user_id` (currently hardcoded to 'default' for single-user mode)
- **RLS policies**: Row Level Security enabled on all tables with user/workspace filtering

### Data Model Patterns
- **Features**: Top-level items with `workspaceId`, `timelineItems[]`, and AI metadata
- **Timeline Items**: Nested in features with `timeline` (MVP/SHORT/LONG), `difficulty`, categories, and `linkedItems[]`
- **Linked Items**: Relationships between timeline items with `relationshipType` (dependency/complements), `direction` (incoming/outgoing)
- **Bidirectional links**: Always maintain both directions when creating links

### Real-time Sync
- **Dual storage**: Supabase (primary) + localStorage (cache/fallback)
- **Sync strategy**: Save to localStorage immediately, then sync to Supabase asynchronously
- **Real-time subscriptions**: Listen to Supabase changes for cross-browser sync
- **Conflict resolution**: Last write wins (timestamp-based)

## Feature Development Guidelines

### Adding New Features
1. **Update data model**: Add fields to relevant objects (features, timeline items, etc.)
2. **Update Supabase schema**: Create migration in `supabase/migrations/` with timestamp prefix
3. **Update sync methods**: Modify `supabaseService` to handle new fields
4. **Update UI**: Add input fields and display logic
5. **Update export/import**: Ensure new data is included in backup format
6. **Test with workspaces**: Verify feature works correctly with multiple workspaces

### Database Migrations
- **Naming convention**: `YYYYMMDDHHMMSS_description.sql`
- **Safe migrations**: Use `IF NOT EXISTS`, `IF NULL`, and other safe SQL patterns
- **Data preservation**: Always migrate existing data when adding required fields
- **Workspace assignment**: New required fields should handle NULL workspace_id gracefully
- **Apply via CLI**: Use `npx supabase db push` to apply migrations

### Export/Import Versioning
- **Current version**: 2.0 (includes workspaces)
- **Version field**: Always include `version` in export JSON
- **Backward compatibility**: Handle v1.0 imports by creating default workspace
- **Complete data**: Export must include:
  - Workspaces (with AI settings)
  - Features (with workspace_id)
  - Timeline items (with categories and links)
  - Link suggestions and rejected links
  - AI action log
  - Memory and custom instructions
  - Model preferences

### Workspace-Specific Features
- **AI Context**: Each workspace has separate `customInstructions` and `aiMemory`
- **Workspace switching**: Clear AI conversation history when switching workspaces
- **Feature creation**: Always assign `currentWorkspaceId` to new features
- **Data loading**: Filter all queries by current workspace
- **UI updates**: Update workspace selector when workspaces change

## UI/UX Patterns

### Workspace UI Components
- **Selector**: Dropdown in header showing current workspace with icon and color
- **Create/Edit Modal**: Form with name, description, color picker, icon (emoji), AI settings
- **Manage Modal**: List view with edit/delete actions, feature counts, active indicator
- **Welcome Screen**: First-time experience when no workspaces exist
- **Empty State**: Friendly message when workspace has no features

### Visual Design
- **Workspace colors**: Use as accent in UI (border, background alpha)
- **Icons**: Emoji or Font Awesome, displayed in selector and modals
- **Animations**: Smooth transitions, floating animations for empty states
- **Responsive**: Mobile-first design with collapsible sections

### User Flow
1. **First visit**: Welcome screen → Create first workspace → Add features
2. **Regular use**: Select workspace → View/edit features → Switch as needed
3. **Management**: Dropdown → Manage Workspaces → Edit/Delete/Create
4. **Export**: 💾 button → Downloads JSON with workspace name in filename

## Common Patterns

### Adding Fields to Features
```javascript
// 1. Update feature object creation
const feature = {
    id: Date.now().toString(),
    workspaceId: this.currentWorkspaceId,  // Always include
    // ... other fields
    newField: value  // Your new field
};

// 2. Update Supabase sync in syncFeatures()
const featuresData = features.map(f => ({
    workspace_id: f.workspaceId,
    new_field: f.newField,  // Map to snake_case for DB
    // ... other fields
}));

// 3. Update export/import
// Add to exportAllData() and importAllData()
```

### Creating Database Migration
```sql
-- Migration: 2025MMDDHHMMSS_add_new_field.sql

-- Add column safely
ALTER TABLE features ADD COLUMN IF NOT EXISTS new_field TEXT;

-- Add index if needed for queries
CREATE INDEX IF NOT EXISTS idx_features_new_field ON features(new_field);

-- Update existing data if required
UPDATE features SET new_field = 'default_value' WHERE new_field IS NULL;
```

### Workspace-Aware Queries
```javascript
// Always filter by workspace when loading
const { data } = await supabase
    .from('features')
    .select('*')
    .eq('user_id', this.userId)
    .eq('workspace_id', workspaceId)  // Required
    .order('created_at', { ascending: false });
```

## Deployment Workflow

### Standard Deployment
1. **Test locally**: Verify changes work in browser
2. **Apply migrations**: `npx supabase db push` for database changes
3. **Commit changes**: Include migration files and code updates
4. **Push to GitHub**: `git push origin main`
5. **Deploy to Vercel**: `vercel --prod`
6. **Verify production**: Test on live URL (https://platform-test-cyan.vercel.app)

### Database-Only Updates
- Use Supabase Dashboard SQL Editor for quick fixes
- Document changes in migration files for version control
- Test queries before running on production

## Troubleshooting

### Data Migration Issues
- **Check workspace_id**: Features without workspace_id won't show up
- **Run migration**: Apply `migrate_existing_data.sql` to fix orphaned features
- **Verify in Supabase**: Check Table Editor to confirm data structure

### Sync Issues
- **Check localStorage**: Data may be cached locally but not synced to Supabase
- **Force sync**: Call `app.saveData()` in browser console
- **Real-time subscriptions**: Verify Supabase project has real-time enabled

### Import Failures
- **Check version**: Ensure backup JSON has `version` field
- **Validate structure**: Must have `features` array at minimum
- **Check console**: Look for specific error messages in browser DevTools

## Security Notes
- **API keys**: Stored in localStorage, NOT included in exports by default
- **User isolation**: Currently single-user mode with 'default' user_id
- **RLS policies**: Configured but not enforced for anonymous users (development mode)
- **Supabase keys**: Use anon key in client, service role key only for backend operations

## Future Considerations
- **Multi-user support**: Add proper authentication and user-specific workspaces
- **Workspace sharing**: Consider team collaboration features
- **Advanced permissions**: Role-based access control for workspaces
- **Workspace templates**: Pre-configured workspaces for common use cases
- **Cross-workspace references**: Optional linking between workspace features (with caution)
