---
name: nextjs-supabase
description: Next.js 16 + Supabase patterns for this PLM platform. Use for auth, database queries, RLS, server components, and API routes.
category: Full Stack
tags: [nextjs, supabase, typescript, react, server-components]
context: fork
tools: [Bash, Read, Write, Edit, Grep, Glob]
model: sonnet
---

# Next.js 16 + Supabase Patterns

## Quick Reference

### Package Manager
```bash
# ALWAYS Bun, NEVER npm/npx
bun install
bun run dev
bun run build
bunx supabase db push
```

### ID Generation
```typescript
// ALWAYS timestamp, NEVER UUID
const id = Date.now().toString()
```

### Database Queries (ALWAYS filter by team_id)
```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('work_items')
    .select('*')
    .eq('team_id', teamId)  // REQUIRED
}

// Client Component
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase
  .from('work_items')
  .select('*')
  .eq('team_id', teamId)  // REQUIRED
```

### Server Actions
```typescript
// next-app/src/app/actions/[feature].ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createWorkItem(formData: FormData) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('work_items')
    .insert({
      id: Date.now().toString(),
      team_id: formData.get('teamId'),
      // ... other fields
    })
    .select()
    .single()
    
  if (error) throw error
  
  revalidatePath('/dashboard/work-items')
  return data
}
```

### API Routes
```typescript
// next-app/src/app/api/[resource]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')
  
  if (!teamId) {
    return NextResponse.json({ error: 'team_id required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('team_id', teamId)
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
```

### RLS Policy Template
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_table.sql
CREATE TABLE table_name (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,  -- NULL breaks RLS silently!
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_table_team ON table_name(team_id);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Policies (all 4 required)
CREATE POLICY "Users can view own team data"
  ON table_name FOR SELECT
  USING (team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own team data"
  ON table_name FOR INSERT
  WITH CHECK (team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own team data"
  ON table_name FOR UPDATE
  USING (team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own team data"
  ON table_name FOR DELETE
  USING (team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  ));
```

### Component Patterns
```tsx
// shadcn/ui imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// Mobile-first, responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="p-4">
    <CardHeader>
      <CardTitle>Title</CardTitle>
    </CardHeader>
    <CardContent>
      Content
    </CardContent>
  </Card>
</div>
```

### Type Safety
```typescript
// Extend existing types, don't create new files
// next-app/src/lib/types/work-item-types.ts

export interface WorkItem {
  id: string
  team_id: string
  title: string
  phase: 'research' | 'planning' | 'execution' | 'review' | 'complete'
  created_at: string
  updated_at: string
}

// Use generated Supabase types
import { Database } from '@/lib/supabase/types'
type WorkItemRow = Database['public']['Tables']['work_items']['Row']
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Empty `{}` from query | Missing team_id filter or RLS | Add `.eq('team_id', teamId)` |
| `NULL` team_id | Nullable column | Change to `TEXT NOT NULL` |
| Type error | Using `any` | Use proper interface |
| Build fails | Missing `'use server'` | Add directive to server actions |

## File Locations

| What | Where |
|------|-------|
| Pages | `next-app/src/app/(dashboard)/...` |
| API Routes | `next-app/src/app/api/...` |
| Server Actions | `next-app/src/app/actions/...` |
| Components | `next-app/src/components/[feature]/...` |
| UI Components | `next-app/src/components/ui/...` |
| Types | `next-app/src/lib/types/...` |
| Supabase Client | `next-app/src/lib/supabase/...` |
| Migrations | `supabase/migrations/...` |
