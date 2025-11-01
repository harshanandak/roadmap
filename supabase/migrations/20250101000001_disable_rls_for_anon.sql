-- Temporarily disable RLS for anonymous testing
-- This allows client-side filtering with user_id
-- In production, you'd want to implement proper Supabase Auth

ALTER TABLE features DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE linked_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Drop the complex RLS policies (we'll rely on client-side filtering)
DROP POLICY IF EXISTS "Users can view their own features" ON features;
DROP POLICY IF EXISTS "Users can insert their own features" ON features;
DROP POLICY IF EXISTS "Users can update their own features" ON features;
DROP POLICY IF EXISTS "Users can delete their own features" ON features;

DROP POLICY IF EXISTS "Users can view their own timeline items" ON timeline_items;
DROP POLICY IF EXISTS "Users can insert their own timeline items" ON timeline_items;
DROP POLICY IF EXISTS "Users can update their own timeline items" ON timeline_items;
DROP POLICY IF EXISTS "Users can delete their own timeline items" ON timeline_items;

DROP POLICY IF EXISTS "Users can view their own linked items" ON linked_items;
DROP POLICY IF EXISTS "Users can insert their own linked items" ON linked_items;
DROP POLICY IF EXISTS "Users can update their own linked items" ON linked_items;
DROP POLICY IF EXISTS "Users can delete their own linked items" ON linked_items;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

-- Note: For production, implement proper Supabase Auth with anonymous sign-in
-- See: https://supabase.com/docs/guides/auth/auth-anonymous
