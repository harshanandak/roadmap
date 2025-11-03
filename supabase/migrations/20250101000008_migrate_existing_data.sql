-- Migrate existing data to workspace system
-- This ensures that features created before workspace feature are not lost

-- Check if there are any features without workspace_id
DO $$
DECLARE
    orphaned_count INTEGER;
    default_workspace_id TEXT;
BEGIN
    -- Count features without workspace_id
    SELECT COUNT(*) INTO orphaned_count
    FROM features
    WHERE workspace_id IS NULL;

    -- Only proceed if there are orphaned features
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % features without workspace_id. Creating migration workspace...', orphaned_count;

        -- Create a default workspace for existing data
        default_workspace_id := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT;

        INSERT INTO workspaces (id, user_id, name, description, color, icon, created_at, updated_at)
        VALUES (
            default_workspace_id,
            'default',
            'My Roadmap',
            'Default workspace containing your existing features',
            '#3b82f6',
            '📊',
            NOW(),
            NOW()
        );

        -- Assign all features without workspace_id to the default workspace
        UPDATE features
        SET workspace_id = default_workspace_id
        WHERE workspace_id IS NULL;

        -- Update timeline_items
        UPDATE timeline_items ti
        SET workspace_id = default_workspace_id
        FROM features f
        WHERE ti.feature_id = f.id
        AND ti.workspace_id IS NULL;

        -- Update linked_items
        UPDATE linked_items li
        SET workspace_id = default_workspace_id
        FROM timeline_items ti
        WHERE (li.source_item_id = ti.id OR li.target_item_id = ti.id)
        AND li.workspace_id IS NULL;

        RAISE NOTICE 'Successfully migrated % features to workspace "%"', orphaned_count, 'My Roadmap';
    ELSE
        RAISE NOTICE 'No orphaned features found. Migration not needed.';
    END IF;
END $$;
