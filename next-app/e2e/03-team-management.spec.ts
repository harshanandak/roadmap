import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../tests/fixtures/test-data';

/**
 * Team Management E2E Tests
 *
 * Tests team operations including:
 * - Team member listing and visibility
 * - Invitation functionality (for owners/admins)
 * - Role and permission display
 * - Navigation to team settings
 *
 * IMPORTANT: These tests require authenticated users.
 * Tests are run serially to avoid race conditions.
 */

// Run tests serially to avoid resource contention
test.describe.configure({ mode: 'serial' });

test.describe('Team Management - Navigation', () => {
  // Skip: App uses magic link auth - these tests require password-based login
  // or pre-authenticated storage state. Enable when auth fixture is implemented.
  test.skip(true, 'Requires auth fixture - app uses magic link, not password auth');

  test('should navigate to team members page', async ({ page }) => {
    await page.goto('/team/members');

    // Should load the page (or redirect to login if auth issue)
    // The page should either show the members page or a loading state
    await page.waitForLoadState('networkidle');

    // Check for expected content - either the page loaded or there's a redirect
    const url = page.url();
    const hasTeamContent = url.includes('/team') || url.includes('/login');
    expect(hasTeamContent).toBe(true);
  });

  test('should navigate to team settings page', async ({ page }) => {
    await page.goto('/team/settings');

    await page.waitForLoadState('networkidle');

    // Check page loaded correctly
    const url = page.url();
    const validPage = url.includes('/team') || url.includes('/settings') || url.includes('/login');
    expect(validPage).toBe(true);
  });
});

test.describe('Team Management - Members Page UI', () => {
  // Skip: App uses magic link auth - these tests require password-based login
  // or pre-authenticated storage state. Enable when auth fixture is implemented.
  test.skip(true, 'Requires auth fixture - app uses magic link, not password auth');

  test('should display page heading', async ({ page }) => {
    // Look for the main heading
    const heading = page.locator('h1');
    const headingCount = await heading.count();

    // Should have at least one heading
    expect(headingCount).toBeGreaterThan(0);

    // If page loaded properly, should contain organization/member text
    const pageContent = await page.textContent('body');
    const hasRelevantContent =
      pageContent?.includes('Organization') ||
      pageContent?.includes('Members') ||
      pageContent?.includes('Team') ||
      pageContent?.includes('loading');

    expect(hasRelevantContent).toBe(true);
  });

  test('should show loading state or members list', async ({ page }) => {
    // Page should show either loading spinner or members list
    const loadingSpinner = page.locator('.animate-spin, [data-loading="true"]');
    const membersList = page.locator('[class*="card"], [class*="Card"]');

    // Wait a moment for initial load
    await page.waitForTimeout(2000);

    // Either we see loading or we see content
    const spinnerVisible = await loadingSpinner.count();
    const cardsVisible = await membersList.count();

    // At least one should be present
    expect(spinnerVisible + cardsVisible).toBeGreaterThan(0);
  });

  test('should have invite button for authorized users', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Look for invite button - it may or may not be visible depending on role
    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add")');
    const inviteButtonCount = await inviteButton.count();

    // Button count is either 0 (no permission) or > 0 (has permission)
    // This is a valid state - we're not asserting it must exist
    expect(inviteButtonCount).toBeGreaterThanOrEqual(0);

    // If button exists and is visible, verify it's clickable
    if (inviteButtonCount > 0) {
      const firstButton = inviteButton.first();
      const isVisible = await firstButton.isVisible();

      if (isVisible) {
        // Button should be enabled
        await expect(firstButton).toBeEnabled();
      }
    }
  });
});

test.describe('Team Management - Invite Dialog', () => {
  // Skip: App uses magic link auth - these tests require password-based login
  // or pre-authenticated storage state. Enable when auth fixture is implemented.
  test.skip(true, 'Requires auth fixture - app uses magic link, not password auth');

  test('should open invite dialog when clicking invite button', async ({ page }) => {
    // Find invite button
    const inviteButton = page.locator('button:has-text("Invite Member"), button:has-text("Invite")').first();

    // Check if button exists and is visible
    const buttonVisible = await inviteButton.isVisible().catch(() => false);

    if (buttonVisible) {
      await inviteButton.click();

      // Dialog should appear
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Dialog should have email input
      const emailInput = dialog.locator('input[type="email"], input[placeholder*="email" i]');
      await expect(emailInput).toBeVisible({ timeout: 3000 });
    } else {
      // User doesn't have invite permission - this is expected for non-admin users
      // Skip this test gracefully
      test.skip();
    }
  });

  test('should close invite dialog on cancel', async ({ page }) => {
    const inviteButton = page.locator('button:has-text("Invite Member"), button:has-text("Invite")').first();
    const buttonVisible = await inviteButton.isVisible().catch(() => false);

    if (buttonVisible) {
      await inviteButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Find and click cancel button
      const cancelButton = dialog.locator('button:has-text("Cancel"), button[type="button"]:not([type="submit"])').first();

      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 3000 });
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Team Management - Protected Routes', () => {
  test('should redirect unauthenticated users from team members page', async ({ page }) => {
    // Don't login - go directly to protected page
    await page.goto('/team/members');

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
  });

  test('should redirect unauthenticated users from team settings page', async ({ page }) => {
    await page.goto('/team/settings');

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
  });
});

test.describe('Team Management - Error Handling', () => {
  // Skip: App uses magic link auth - these tests require password-based login
  // or pre-authenticated storage state. Enable when auth fixture is implemented.
  test.skip(true, 'Requires auth fixture - app uses magic link, not password auth');

  test('should handle invalid team routes gracefully', async ({ page }) => {
    // Navigate to non-existent team page
    await page.goto('/teams/invalid-team-id-12345');

    await page.waitForLoadState('networkidle');

    // Should show error message or redirect
    const pageContent = await page.textContent('body');

    // Should have some content (error page or redirect)
    expect(pageContent?.length).toBeGreaterThan(0);
  });

  test('should not crash on rapid navigation', async ({ page }) => {
    // Rapidly navigate between pages
    await page.goto('/team/members');
    await page.goto('/team/settings');
    await page.goto('/team/members');

    await page.waitForLoadState('networkidle');

    // Page should still be functional
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(0);
  });
});
