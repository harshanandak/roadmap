-- ================================================================
-- Upgrade harsha@befach.com to Pro Plan
-- Execute this in Supabase SQL Editor
-- ================================================================

-- Step 1: Find the user and their teams
DO $$
DECLARE
  v_user_id TEXT;
  v_team_record RECORD;
  v_teams_updated INTEGER := 0;
BEGIN
  -- Find the user ID
  SELECT id INTO v_user_id
  FROM users
  WHERE email = 'harsha@befach.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User harsha@befach.com not found';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Found user: harsha@befach.com (ID: %)', v_user_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Upgrade all teams that this user is a member of
  FOR v_team_record IN
    SELECT DISTINCT t.id, t.name, t.plan, t.member_count
    FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = v_user_id
  LOOP
    RAISE NOTICE 'Team: % (ID: %)', v_team_record.name, v_team_record.id;
    RAISE NOTICE '  Current plan: %', v_team_record.plan;
    RAISE NOTICE '  Members: %', v_team_record.member_count;

    IF v_team_record.plan = 'pro' THEN
      RAISE NOTICE '  Status: ✅ Already on Pro plan';
    ELSE
      -- Update to Pro plan
      UPDATE teams
      SET
        plan = 'pro',
        updated_at = NOW()
      WHERE id = v_team_record.id;

      v_teams_updated := v_teams_updated + 1;
      RAISE NOTICE '  Status: ✅ UPGRADED to Pro plan';
    END IF;

    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Teams updated: %', v_teams_updated;
  RAISE NOTICE '========================================';

END $$;

-- Step 2: Verify the update
SELECT
  u.email,
  u.name as user_name,
  t.name as team_name,
  t.plan,
  t.member_count,
  tm.role,
  t.updated_at
FROM users u
JOIN team_members tm ON u.id = tm.user_id
JOIN teams t ON tm.team_id = t.id
WHERE u.email = 'harsha@befach.com';
