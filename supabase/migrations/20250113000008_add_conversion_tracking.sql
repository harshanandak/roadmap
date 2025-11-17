-- Add conversion tracking fields to work_items table
-- Tracks how work items evolve through the product lifecycle

-- Add conversion tracking fields
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS converted_from_id TEXT;
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS converted_from_type TEXT
  CHECK (converted_from_type IN ('mind_map_node', 'work_item', 'user_need', 'bug_report', 'user_request'));
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES users(id);

-- Add conversion chain for full lineage tracking
-- Format: [{id, type, title, convertedAt, convertedBy, reason}]
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS conversion_chain JSONB DEFAULT '[]'::jsonb;

-- Add reason for conversion
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS conversion_reason TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_items_converted_from
  ON work_items(converted_from_id, converted_from_type);

CREATE INDEX IF NOT EXISTS idx_work_items_converted_by
  ON work_items(converted_by);

-- Helper function to get conversion lineage
CREATE OR REPLACE FUNCTION get_work_item_conversion_lineage(work_item_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB := '[]'::jsonb;
  current_id TEXT;
  current_type TEXT;
  current_record RECORD;
  max_depth INT := 50; -- Prevent infinite loops
  depth INT := 0;
BEGIN
  current_id := work_item_id_param;

  -- Traverse up the conversion chain
  WHILE current_id IS NOT NULL AND depth < max_depth LOOP
    -- Get current work item details
    SELECT
      w.id,
      w.name,
      w.type,
      w.converted_from_id,
      w.converted_from_type,
      w.converted_at,
      w.converted_by,
      w.conversion_reason,
      u.name as converted_by_name,
      u.email as converted_by_email
    INTO current_record
    FROM work_items w
    LEFT JOIN users u ON u.id = w.converted_by
    WHERE w.id = current_id;

    IF NOT FOUND THEN
      EXIT;
    END IF;

    -- Add to result chain
    result := result || jsonb_build_object(
      'id', current_record.id,
      'name', current_record.name,
      'type', current_record.type,
      'convertedFromType', current_record.converted_from_type,
      'convertedAt', current_record.converted_at,
      'convertedBy', jsonb_build_object(
        'id', current_record.converted_by,
        'name', current_record.converted_by_name,
        'email', current_record.converted_by_email
      ),
      'reason', current_record.conversion_reason
    );

    -- Move to parent
    current_id := current_record.converted_from_id;
    depth := depth + 1;
  END LOOP;

  RETURN result;
END;
$$;

-- Function to get all descendants of a work item (items converted from this one)
CREATE OR REPLACE FUNCTION get_work_item_descendants(work_item_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', w.id,
      'name', w.name,
      'type', w.type,
      'convertedAt', w.converted_at,
      'convertedBy', jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email
      ),
      'reason', w.conversion_reason
    )
  )
  INTO result
  FROM work_items w
  LEFT JOIN users u ON u.id = w.converted_by
  WHERE w.converted_from_id = work_item_id_param
    AND w.converted_from_type = 'work_item';

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

COMMENT ON COLUMN work_items.converted_from_id IS 'ID of the item this was converted from';
COMMENT ON COLUMN work_items.converted_from_type IS 'Type of source item (mind_map_node, work_item, user_need, etc.)';
COMMENT ON COLUMN work_items.converted_at IS 'When this item was converted';
COMMENT ON COLUMN work_items.converted_by IS 'User who performed the conversion';
COMMENT ON COLUMN work_items.conversion_chain IS 'Full lineage chain as JSONB array';
COMMENT ON COLUMN work_items.conversion_reason IS 'Why this conversion was made';
