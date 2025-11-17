-- Add timeline date fields to work_items table for Gantt chart visualization
-- Migration: 20251115133000_add_timeline_dates.sql

-- Add date columns
ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS duration_days INT;

-- Add check constraint to ensure end_date is after start_date
ALTER TABLE work_items
ADD CONSTRAINT check_end_date_after_start
CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- Add index for timeline queries
CREATE INDEX IF NOT EXISTS idx_work_items_start_date ON work_items(start_date);
CREATE INDEX IF NOT EXISTS idx_work_items_end_date ON work_items(end_date);

-- Add comment explaining the fields
COMMENT ON COLUMN work_items.start_date IS 'Planned start date for the work item';
COMMENT ON COLUMN work_items.end_date IS 'Planned end date for the work item';
COMMENT ON COLUMN work_items.duration_days IS 'Calculated duration in business days';

-- Create function to auto-calculate duration when dates are set
CREATE OR REPLACE FUNCTION calculate_work_item_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate duration in days if both dates are set
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    NEW.duration_days := (NEW.end_date - NEW.start_date) + 1;
  ELSE
    NEW.duration_days := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate duration
DROP TRIGGER IF EXISTS trigger_calculate_duration ON work_items;
CREATE TRIGGER trigger_calculate_duration
  BEFORE INSERT OR UPDATE OF start_date, end_date
  ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_work_item_duration();
