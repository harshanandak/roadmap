/**
 * Playwright Global Teardown
 *
 * Runs once after all tests complete to clean up test data.
 * This prevents orphaned data from accumulating in the test database.
 */

import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Running global test teardown...\n');

  // Only cleanup if service role key is available
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    console.log('⚠️  Service role key not available - skipping cleanup');
    console.log('   Test data may remain in database. Clean manually if needed.');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // 1. Clean up test teams (by name pattern)
    const { data: testTeams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .or('name.like.%Test Team%,name.like.%test_%,name.like.%Team-%');

    if (testTeams && testTeams.length > 0) {
      console.log(`Found ${testTeams.length} test teams to clean up`);

      for (const team of testTeams) {
        // Delete team members first (foreign key)
        await supabase.from('team_members').delete().eq('team_id', team.id);

        // Delete workspaces (cascades to work_items, etc.)
        await supabase.from('workspaces').delete().eq('team_id', team.id);

        // Delete the team
        await supabase.from('teams').delete().eq('id', team.id);

        console.log(`   Cleaned up: ${team.name}`);
      }
    } else {
      console.log('✅ No test teams found to clean up');
    }

    // 2. Clean up test auth users (by email pattern)
    try {
      const { data: users } = await supabase.auth.admin.listUsers();

      if (users && users.users) {
        const testUsers = users.users.filter(
          (u) =>
            u.email?.includes('@test.example.com') ||
            u.email?.includes('test_') ||
            u.email?.includes('_test@')
        );

        if (testUsers.length > 0) {
          console.log(`Found ${testUsers.length} test users to clean up`);

          for (const user of testUsers) {
            await supabase.auth.admin.deleteUser(user.id);
            console.log(`   Deleted user: ${user.email}`);
          }
        } else {
          console.log('✅ No test users found to clean up');
        }
      }
    } catch (e) {
      // Auth admin operations may not be available
      console.log('⚠️  Could not clean up test users (auth admin not available)');
    }

    // 3. Clean up orphaned resources
    const { data: orphanedResources } = await supabase
      .from('resources')
      .select('id')
      .is('team_id', null);

    if (orphanedResources && orphanedResources.length > 0) {
      console.log(`Cleaning up ${orphanedResources.length} orphaned resources`);
      await supabase
        .from('resources')
        .delete()
        .is('team_id', null);
    }

    console.log('\n✅ Global teardown complete!\n');
  } catch (error) {
    console.error('⚠️  Error during teardown:', error);
    // Don't throw - teardown errors shouldn't fail the test run
  }
}

export default globalTeardown;
