/**
 * Playwright Test Fixtures
 *
 * These fixtures provide convenient setup and teardown for tests,
 * including authenticated users, teams, workspaces, and test data.
 */

import { test as baseTest, expect } from '@playwright/test';
import { Page } from '@playwright/test';
import { loginUser, logoutUser, getCurrentUserId } from '../helpers/auth';
import {
  createTeamInDatabase,
  createWorkspaceInDatabase,
  createWorkItemInDatabase,
  cleanupTeamData,
  cleanupWorkspaceData,
  addTeamMemberInDatabase,
} from './database';
import { TEST_USERS, TEST_TEAMS, TEST_WORKSPACES, TEST_WORK_ITEMS } from '../fixtures/test-data';

/**
 * Extended test fixture with authentication
 */
interface AuthFixtures {
  authenticatedPage: Page;
  userAPage: Page;
  userBPage: Page;
}

/**
 * Extended test fixture with test data
 */
interface TestDataFixtures {
  testTeamId: string;
  testWorkspaceId: string;
  testWorkItemId: string;
}

/**
 * Create authenticated page fixture for User A
 */
export const authenticatedPageFixture = baseTest.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login User A
    await loginUser(page, TEST_USERS.userA.email, TEST_USERS.userA.password);

    // Wait for dashboard to load
    await page.waitForURL(/\/(dashboard|workspaces)/, { timeout: 10000 });

    // Verify authentication
    const isAuthenticated = await page.evaluate(() => {
      return !!localStorage.getItem('sb-auth-token');
    });

    expect(isAuthenticated).toBe(true);

    // Use the page in test
    await use(page);

    // Cleanup: logout
    await logoutUser(page);
  },
});

/**
 * Create separate authenticated pages for User A and User B
 */
export const multiUserFixture = baseTest.extend<AuthFixtures>({
  userAPage: async ({ browser }, use) => {
    const context = await browser!.newContext();
    const page = await context.newPage();

    // Login User A
    await loginUser(page, TEST_USERS.userA.email, TEST_USERS.userA.password);
    await page.waitForURL(/\/(dashboard|workspaces)/, { timeout: 10000 });

    await use(page);

    await context.close();
  },

  userBPage: async ({ browser }, use) => {
    const context = await browser!.newContext();
    const page = await context.newPage();

    // Login User B
    await loginUser(page, TEST_USERS.userB.email, TEST_USERS.userB.password);
    await page.waitForURL(/\/(dashboard|workspaces)/, { timeout: 10000 });

    await use(page);

    await context.close();
  },
});

/**
 * Test data fixture with team, workspace, and work items
 */
export const testDataFixture = baseTest.extend<TestDataFixtures>({
  testTeamId: async ({}, use) => {
    // Create test team
    const userId = `test_user_${Date.now()}`;

    const team = await createTeamInDatabase({
      name: TEST_TEAMS.teamA.name,
      ownerId: userId,
    });

    const teamId = team.id;

    await use(teamId);

    // Cleanup
    await cleanupTeamData(teamId);
  },

  testWorkspaceId: async ({ testTeamId }, use) => {
    // Create test workspace in the test team
    const workspace = await createWorkspaceInDatabase({
      name: TEST_WORKSPACES.productRoadmap.name,
      description: TEST_WORKSPACES.productRoadmap.description,
      teamId: testTeamId,
    });

    const workspaceId = workspace.id;

    await use(workspaceId);

    // Cleanup
    await cleanupWorkspaceData(workspaceId);
  },

  testWorkItemId: async ({ testTeamId, testWorkspaceId }, use) => {
    // Create test work item
    const workItem = await createWorkItemInDatabase({
      title: TEST_WORK_ITEMS.authentication.title,
      description: TEST_WORK_ITEMS.authentication.description,
      type: TEST_WORK_ITEMS.authentication.type as any,
      phase: TEST_WORK_ITEMS.authentication.phase,
      priority: TEST_WORK_ITEMS.authentication.priority,
      teamId: testTeamId,
      workspaceId: testWorkspaceId,
    });

    const workItemId = workItem.id;

    await use(workItemId);

    // No explicit cleanup needed - workspace cleanup handles it
  },
});

/**
 * Combined fixture for authenticated user with test data
 */
export const authenticatedWithDataFixture = baseTest.extend<
  AuthFixtures & TestDataFixtures
>({
  authenticatedPage: async ({ page }, use) => {
    await loginUser(page, TEST_USERS.userA.email, TEST_USERS.userA.password);
    await page.waitForURL(/\/(dashboard|workspaces)/, { timeout: 10000 });
    await use(page);
    await logoutUser(page);
  },

  testTeamId: async ({}, use) => {
    const userId = `test_user_${Date.now()}`;
    const team = await createTeamInDatabase({
      name: TEST_TEAMS.teamA.name,
      ownerId: userId,
    });
    await use(team.id);
    await cleanupTeamData(team.id);
  },

  testWorkspaceId: async ({ testTeamId }, use) => {
    const workspace = await createWorkspaceInDatabase({
      name: TEST_WORKSPACES.productRoadmap.name,
      teamId: testTeamId,
    });
    await use(workspace.id);
    await cleanupWorkspaceData(workspace.id);
  },

  testWorkItemId: async ({ testTeamId, testWorkspaceId }, use) => {
    const workItem = await createWorkItemInDatabase({
      title: TEST_WORK_ITEMS.authentication.title,
      type: TEST_WORK_ITEMS.authentication.type as any,
      phase: TEST_WORK_ITEMS.authentication.phase,
      priority: TEST_WORK_ITEMS.authentication.priority,
      teamId: testTeamId,
      workspaceId: testWorkspaceId,
    });
    await use(workItem.id);
  },
});

/**
 * Export test function with authenticatedPageFixture
 */
export const testWithAuth = authenticatedPageFixture;

/**
 * Export test function with multiple users
 */
export const testWithMultipleUsers = multiUserFixture;

/**
 * Export test function with test data
 */
export const testWithData = testDataFixture;

/**
 * Export test function with auth and data
 */
export const testWithAuthAndData = authenticatedWithDataFixture;
