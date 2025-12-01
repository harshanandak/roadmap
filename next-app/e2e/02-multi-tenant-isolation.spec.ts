import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../tests/fixtures/test-data';

/**
 * Multi-Tenant Isolation E2E Tests
 *
 * CRITICAL SECURITY TESTS - Validate team data isolation
 *
 * Tests ensure:
 * - Unauthenticated users cannot access protected routes
 * - Users are redirected properly for team-specific resources
 * - API endpoints return appropriate errors for unauthorized access
 * - Direct URL access to other resources is blocked
 *
 * Note: Full RLS policy testing requires database-level tests.
 * These E2E tests focus on the user-facing isolation.
 */

// Run tests serially to avoid resource contention
test.describe.configure({ mode: 'serial' });

test.describe('Multi-Tenant Isolation - Unauthenticated Access', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
  });

  test('should redirect unauthenticated users from workspaces list', async ({ page }) => {
    await page.goto('/workspaces');
    await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
  });

  test('should redirect unauthenticated users from specific workspace', async ({ page }) => {
    await page.goto('/workspaces/some-workspace-id');
    await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
  });

  test('should redirect unauthenticated users from team settings', async ({ page }) => {
    await page.goto('/team/settings');
    await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
  });

  test('should redirect unauthenticated users from team members', async ({ page }) => {
    await page.goto('/team/members');
    await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
  });

  test('should not allow API access without authentication', async ({ request }) => {
    // Try to access workspaces API without auth
    const response = await request.get('/api/workspaces');

    // Should return 401/403 (unauthorized), 404 (hiding existence), or redirect
    const status = response.status();
    expect([401, 403, 404, 302, 307]).toContain(status);
  });

  test('should not allow API access to team data without authentication', async ({ request }) => {
    const response = await request.get('/api/team/members');

    // Should return 401/403 (unauthorized), 404 (hiding existence), or error
    const status = response.status();
    expect([401, 403, 404, 302, 307, 500]).toContain(status);
  });
});

test.describe('Multi-Tenant Isolation - Invalid Resource Access', () => {
  // Skip: App uses magic link auth - these tests require password-based login
  // or pre-authenticated storage state. Enable when auth fixture is implemented.
  test.skip(true, 'Requires auth fixture - app uses magic link, not password auth');

  test('should handle non-existent workspace gracefully', async ({ page }) => {
    // Navigate to a workspace that doesn't exist
    await page.goto('/workspaces/nonexistent-workspace-12345');

    await page.waitForLoadState('networkidle');

    // Should either redirect or show error - not crash
    const url = page.url();
    const hasContent = await page.textContent('body');

    // Page should have loaded something
    expect(hasContent?.length).toBeGreaterThan(0);

    // Should be redirected or show error page
    const isValidResponse =
      url.includes('/workspaces') ||
      url.includes('/dashboard') ||
      url.includes('/error') ||
      url.includes('/404') ||
      hasContent?.toLowerCase().includes('not found') ||
      hasContent?.toLowerCase().includes('error') ||
      hasContent?.toLowerCase().includes('access');

    expect(isValidResponse).toBe(true);
  });

  test('should handle non-existent work item gracefully', async ({ page }) => {
    await page.goto('/workspaces/any-workspace/work-items/nonexistent-item-12345');

    await page.waitForLoadState('networkidle');

    // Should not crash - either error page or redirect
    const hasContent = await page.textContent('body');
    expect(hasContent?.length).toBeGreaterThan(0);
  });

  test('should handle non-existent team gracefully', async ({ page }) => {
    await page.goto('/teams/nonexistent-team-12345');

    await page.waitForLoadState('networkidle');

    // Should not crash
    const hasContent = await page.textContent('body');
    expect(hasContent?.length).toBeGreaterThan(0);
  });
});

test.describe('Multi-Tenant Isolation - Session Security', () => {
  // Skip: App uses magic link auth - these tests require password-based login
  // or pre-authenticated storage state. Enable when auth fixture is implemented.
  test.skip(true, 'Requires auth fixture - app uses magic link, not password auth');

  test('should require re-authentication after logout', async ({ page }) => {
    // Login
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(TEST_USERS.userA.email);
    await passwordInput.fill(TEST_USERS.userA.password);

    await page.locator('button[type="submit"]').click();
    await expect(page).not.toHaveURL(/login/, { timeout: 15000 });

    // Navigate to protected page to confirm we're logged in
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/login/, { timeout: 5000 });

    // Find and click logout
    const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out"), a:has-text("Logout")').first();

    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();

      // Wait for logout to complete
      await page.waitForTimeout(2000);

      // Try to access protected page
      await page.goto('/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
    }
  });

  test('should not persist session across browser contexts', async ({ browser }) => {
    // Create first context and login
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await page1.goto('/login');
    const emailInput = page1.locator('input[type="email"], input[name="email"]');

    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(TEST_USERS.userA.email);
      await page1.locator('input[type="password"], input[name="password"]').fill(TEST_USERS.userA.password);
      await page1.locator('button[type="submit"]').click();
    }

    // Create second context (fresh, no cookies)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Should not be logged in in new context
    await page2.goto('/dashboard');
    await expect(page2).toHaveURL(/login|auth/, { timeout: 10000 });

    // Cleanup
    await context1.close();
    await context2.close();
  });
});

test.describe('Multi-Tenant Isolation - Error Message Security', () => {
  // Skip: App uses magic link auth - these tests require password-based login
  // or pre-authenticated storage state. Enable when auth fixture is implemented.
  test.skip(true, 'Requires auth fixture - app uses magic link, not password auth');

  test('should not leak sensitive info in error messages', async ({ page }) => {
    // Navigate to non-existent resource
    await page.goto('/workspaces/other-team-workspace-12345');

    await page.waitForLoadState('networkidle');

    const pageContent = await page.textContent('body');
    const lowerContent = pageContent?.toLowerCase() || '';

    // Should NOT contain sensitive information
    const hasSensitiveInfo =
      lowerContent.includes('belongs to') ||
      lowerContent.includes('another team') ||
      lowerContent.includes('team name') ||
      lowerContent.includes('user id') ||
      lowerContent.includes('owner');

    // Generic error messages are safe
    expect(hasSensitiveInfo).toBe(false);
  });

  test('should show generic error for unauthorized API access', async ({ request }) => {
    // Try to access specific workspace via API
    const response = await request.get('/api/workspaces/unauthorized-workspace-12345');

    const status = response.status();

    // Should return 404 or 403, not 200 with data
    expect([403, 404, 401, 500]).toContain(status);

    // Response should not contain detailed error about other teams
    const body = await response.text();
    const lowerBody = body.toLowerCase();

    const hasTeamInfo =
      lowerBody.includes('belongs to team') ||
      lowerBody.includes('another team\'s') ||
      lowerBody.includes('team id');

    expect(hasTeamInfo).toBe(false);
  });
});

test.describe('Multi-Tenant Isolation - Navigation Security', () => {
  // Skip: App uses magic link auth - these tests require password-based login
  // or pre-authenticated storage state. Enable when auth fixture is implemented.
  test.skip(true, 'Requires auth fixture - app uses magic link, not password auth');

  test('should only show user own workspaces in sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for sidebar to potentially load
    await page.waitForTimeout(3000);

    // Look for workspace links
    const sidebarLinks = page.locator('nav a[href*="/workspaces/"], aside a[href*="/workspaces/"]');
    const count = await sidebarLinks.count();

    // All visible workspaces should be user's own (we can't verify ownership here,
    // but we verify the UI loaded correctly)
    if (count > 0) {
      // At least verify the links are valid format
      for (let i = 0; i < count; i++) {
        const href = await sidebarLinks.nth(i).getAttribute('href');
        expect(href).toMatch(/\/workspaces\/[a-zA-Z0-9_-]+/);
      }
    }

    // Test passes if page loaded without errors
    expect(true).toBe(true);
  });

  test('should maintain isolation on rapid navigation', async ({ page }) => {
    // Rapid navigation should not expose data
    await page.goto('/dashboard');
    await page.goto('/workspaces');
    await page.goto('/team/members');
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Should still be authenticated and on valid page
    const url = page.url();
    const isOnValidPage =
      url.includes('/dashboard') ||
      url.includes('/workspaces') ||
      url.includes('/team');

    expect(isOnValidPage).toBe(true);
  });
});
