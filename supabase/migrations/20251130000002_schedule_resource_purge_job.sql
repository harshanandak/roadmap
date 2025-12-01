/**
 * Schedule Automatic Purge of Soft-Deleted Resources
 *
 * Uses pg_cron to run daily cleanup of resources deleted more than 30 days ago.
 * This implements the "recycle bin" pattern with automatic permanent deletion.
 *
 * Schedule: Daily at 3:00 AM UTC
 * Function: purge_deleted_resources(30) - already created in previous migration
 */

-- ============================================================================
-- SCHEDULE THE PURGE JOB
-- ============================================================================

-- First, ensure pg_cron extension is enabled (Supabase has this pre-installed)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required for cron jobs)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule the daily purge job
-- Runs at 3:00 AM UTC every day
SELECT cron.schedule(
  'purge-deleted-resources-daily',  -- Job name (case-sensitive, cannot be changed)
  '0 3 * * *',                       -- Cron expression: minute hour day month weekday
  $$
    -- Call our purge function for resources older than 30 days
    SELECT purge_deleted_resources(30);
  $$
);

-- ============================================================================
-- OPTIONAL: Schedule cleanup for work_item_resources junction table
-- Permanently delete unlinked records after 30 days
-- ============================================================================

-- Create function to purge old unlinked records from junction table
CREATE OR REPLACE FUNCTION purge_unlinked_work_item_resources(days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.work_item_resources
    WHERE is_unlinked = TRUE
      AND unlinked_at IS NOT NULL
      AND unlinked_at < NOW() - (days || ' days')::INTERVAL
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  -- Log the purge action
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Purged % unlinked work_item_resources records older than % days', deleted_count, days;
  END IF;

  RETURN deleted_count;
END;
$$;

-- Schedule cleanup of unlinked junction records (same schedule)
SELECT cron.schedule(
  'purge-unlinked-resources-daily',
  '0 3 * * *',
  $$
    SELECT purge_unlinked_work_item_resources(30);
  $$
);

-- ============================================================================
-- HELPER VIEWS FOR MONITORING
-- ============================================================================

-- Create a view to easily check cron job status
CREATE OR REPLACE VIEW public.cron_job_status AS
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database,
  username
FROM cron.job
WHERE jobname LIKE 'purge-%';

-- Grant read access to authenticated users (for admin dashboards)
GRANT SELECT ON public.cron_job_status TO authenticated;

-- ============================================================================
-- MANUAL CONTROLS
-- ============================================================================

-- Function to manually trigger purge (useful for testing or immediate cleanup)
CREATE OR REPLACE FUNCTION manual_purge_all_deleted(days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resources_purged INTEGER;
  links_purged INTEGER;
BEGIN
  -- Purge resources
  SELECT purge_deleted_resources(days) INTO resources_purged;

  -- Purge unlinked junction records
  SELECT purge_unlinked_work_item_resources(days) INTO links_purged;

  RETURN jsonb_build_object(
    'resources_purged', resources_purged,
    'links_purged', links_purged,
    'purge_threshold_days', days,
    'executed_at', NOW()
  );
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION purge_unlinked_work_item_resources IS
  'Permanently deletes work_item_resources records that have been unlinked for more than the specified days';

COMMENT ON FUNCTION manual_purge_all_deleted IS
  'Manually triggers purge of all soft-deleted resources and unlinked records. Returns summary of purged items.';

COMMENT ON VIEW cron_job_status IS
  'View to monitor status of scheduled purge cron jobs';
