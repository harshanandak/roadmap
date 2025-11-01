-- Grant full anonymous access for testing
-- In production, you'd want to implement proper Supabase Auth

-- Ensure RLS is disabled
ALTER TABLE features DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE linked_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Grant ALL permissions to anonymous role
GRANT ALL ON features TO anon;
GRANT ALL ON timeline_items TO anon;
GRANT ALL ON linked_items TO anon;
GRANT ALL ON user_settings TO anon;

-- Grant permissions to authenticated role as well
GRANT ALL ON features TO authenticated;
GRANT ALL ON timeline_items TO authenticated;
GRANT ALL ON linked_items TO authenticated;
GRANT ALL ON user_settings TO authenticated;

-- Allow usage of UUID functions
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO anon;
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO authenticated;
