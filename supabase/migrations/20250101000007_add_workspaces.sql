-- Add workspaces feature to support multiple independent roadmaps
-- Each workspace has its own features, AI settings, and visual identity

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT DEFAULT '📊',
    custom_instructions TEXT,
    ai_memory JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add workspace_id column to existing tables
ALTER TABLE features ADD COLUMN IF NOT EXISTS workspace_id TEXT;
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS workspace_id TEXT;
ALTER TABLE linked_items ADD COLUMN IF NOT EXISTS workspace_id TEXT;

-- Create indexes for workspace_id columns
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON workspaces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_features_workspace_id ON features(workspace_id);
CREATE INDEX IF NOT EXISTS idx_timeline_items_workspace_id ON timeline_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linked_items_workspace_id ON linked_items(workspace_id);

-- Add trigger for workspaces updated_at
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces table
CREATE POLICY "Users can view their own workspaces"
    ON workspaces FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own workspaces"
    ON workspaces FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own workspaces"
    ON workspaces FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- Enable real-time for workspaces table
ALTER PUBLICATION supabase_realtime ADD TABLE workspaces;

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON workspaces TO authenticated, anon;
