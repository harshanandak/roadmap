-- Upgrade harsha@befach.com's team to pro plan

-- Update the team plan to 'pro' for all teams where harsha@befach.com is a member
UPDATE teams
SET
  plan = 'pro',
  updated_at = NOW()
WHERE id IN (
  SELECT tm.team_id
  FROM team_members tm
  JOIN users u ON tm.user_id = u.id
  WHERE u.email = 'harsha@befach.com'
);

-- Verify the update by selecting the updated teams
-- (This SELECT will show in the migration output)
DO $$
DECLARE
  updated_teams_count INTEGER;
  team_info RECORD;
BEGIN
  SELECT COUNT(*) INTO updated_teams_count
  FROM teams t
  JOIN team_members tm ON t.id = tm.team_id
  JOIN users u ON tm.user_id = u.id
  WHERE u.email = 'harsha@befach.com' AND t.plan = 'pro';

  RAISE NOTICE 'Successfully upgraded % team(s) to pro plan for harsha@befach.com', updated_teams_count;

  -- Log each team that was updated
  FOR team_info IN
    SELECT t.id, t.name, t.plan, t.member_count
    FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    JOIN users u ON tm.user_id = u.id
    WHERE u.email = 'harsha@befach.com'
  LOOP
    RAISE NOTICE 'Team: % (ID: %, Plan: %, Members: %)',
      team_info.name, team_info.id, team_info.plan, team_info.member_count;
  END LOOP;
END $$;
