# Database Rules (Supabase)

## Migration Template

```sql
CREATE TABLE table_name (
  id TEXT PRIMARY KEY,              -- Date.now().toString()
  team_id TEXT NOT NULL,            -- NEVER NULL (breaks RLS silently)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_table_team ON table_name(team_id);

-- RLS policies (ALL 4 required)
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_team" ON table_name
  FOR SELECT USING (team_id = (SELECT current_team_id()));

CREATE POLICY "insert_own_team" ON table_name
  FOR INSERT WITH CHECK (team_id = (SELECT current_team_id()));

CREATE POLICY "update_own_team" ON table_name
  FOR UPDATE USING (team_id = (SELECT current_team_id()));

CREATE POLICY "delete_own_team" ON table_name
  FOR DELETE USING (team_id = (SELECT current_team_id()));
```

## Query Pattern

```typescript
// ALWAYS filter by team_id
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('team_id', teamId)  // NEVER skip this
```

## Real-time Subscriptions

```typescript
const channel = supabase.channel('changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    filter: `team_id=eq.${teamId}`
  }, callback)
  .subscribe()

// Cleanup in useEffect
return () => { channel.unsubscribe() }
```

## Feature Gates

```typescript
if (team.plan === 'pro') {
  // Show Pro feature
} else {
  // Show upgrade modal
}
```

## Commands

```bash
bunx supabase db push                    # Apply migrations
bunx supabase gen types typescript       # Generate types
```
