-- Features table
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Feature', 'Service')),
    purpose TEXT,
    ai_generated JSONB,
    ai_created BOOLEAN DEFAULT false,
    ai_modified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline items table
CREATE TABLE IF NOT EXISTS timeline_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    timeline TEXT NOT NULL CHECK (timeline IN ('MVP', 'SHORT', 'LONG')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    usp TEXT,
    integration_type TEXT,
    category TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Linked items table (for feature dependencies/relationships)
CREATE TABLE IF NOT EXISTS linked_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    source_item_id UUID NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    target_item_id UUID NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('dependency', 'complements')),
    reason TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_item_id, target_item_id)
);

-- User settings table (theme, AI memory, custom instructions)
CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    theme TEXT DEFAULT 'dark',
    custom_instructions TEXT,
    ai_memory JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_features_user_id ON features(user_id);
CREATE INDEX IF NOT EXISTS idx_features_created_at ON features(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_items_feature_id ON timeline_items(feature_id);
CREATE INDEX IF NOT EXISTS idx_timeline_items_user_id ON timeline_items(user_id);
CREATE INDEX IF NOT EXISTS idx_linked_items_source ON linked_items(source_item_id);
CREATE INDEX IF NOT EXISTS idx_linked_items_target ON linked_items(target_item_id);
CREATE INDEX IF NOT EXISTS idx_linked_items_user_id ON linked_items(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for features table
CREATE POLICY "Users can view their own features"
    ON features FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own features"
    ON features FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own features"
    ON features FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own features"
    ON features FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- RLS Policies for timeline_items table
CREATE POLICY "Users can view their own timeline items"
    ON timeline_items FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own timeline items"
    ON timeline_items FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own timeline items"
    ON timeline_items FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own timeline items"
    ON timeline_items FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- RLS Policies for linked_items table
CREATE POLICY "Users can view their own linked items"
    ON linked_items FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own linked items"
    ON linked_items FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own linked items"
    ON linked_items FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own linked items"
    ON linked_items FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- RLS Policies for user_settings table
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_features_updated_at
    BEFORE UPDATE ON features
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_items_updated_at
    BEFORE UPDATE ON timeline_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE features;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_items;
ALTER PUBLICATION supabase_realtime ADD TABLE linked_items;
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON features TO authenticated, anon;
GRANT ALL ON timeline_items TO authenticated, anon;
GRANT ALL ON linked_items TO authenticated, anon;
GRANT ALL ON user_settings TO authenticated, anon;

GRANT USAGE ON SCHEMA public TO authenticated, anon;
