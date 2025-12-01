import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Application Health Check
 *
 * These tests verify that the core application is functional:
 * - Homepage loads with correct branding
 * - Login/Signup pages render properly
 * - Protected routes redirect unauthenticated users
 * - Static assets load without errors
 *
 * These should run on every deployment and across all browsers.
 */
test.describe('Smoke Tests - Application Health Check', () => {
  test('homepage loads and displays branding', async ({ page }) => {
    await page.goto('/');

    // Verify correct app title (not stale "Create Next App")
    await expect(page).toHaveTitle(/Product Lifecycle Platform/);

    // Verify main heading
    await expect(page.locator('h1')).toContainText('Product Lifecycle Platform');

    // Verify hero section
    await expect(page.locator('h2')).toContainText('Manage Your Product Roadmap');
  });

  test('homepage displays navigation elements', async ({ page }) => {
    await page.goto('/');

    // Sign In button should be visible
    const signInButton = page.locator('a:has-text("Sign In")').first();
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toHaveAttribute('href', '/login');

    // Get Started button should be visible
    const getStartedButton = page.locator('a:has-text("Get Started")').first();
    await expect(getStartedButton).toBeVisible();
    await expect(getStartedButton).toHaveAttribute('href', '/signup');
  });

  test('homepage displays feature cards', async ({ page }) => {
    await page.goto('/');

    // Verify all three feature cards are present (use headings to be specific)
    await expect(page.getByRole('heading', { name: 'Mind Mapping' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Phase-Based Workflow' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI-Powered' })).toBeVisible();
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Should have email input (magic link auth - no password field)
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Should have magic link submit button
    await expect(page.getByRole('button', { name: /Send Magic Link/i })).toBeVisible();

    // Should have Google OAuth option
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
  });

  test('signup page loads correctly', async ({ page }) => {
    await page.goto('/signup');

    // Should have email input
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();

    // Should have submit button or get started form
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('unauthenticated user is redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
  });

  test('unauthenticated user is redirected from workspaces', async ({ page }) => {
    await page.goto('/workspaces');

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
  });

  test('static assets load without critical errors', async ({ page }) => {
    const failedRequests: string[] = [];

    // Listen for failed requests
    page.on('requestfailed', (request) => {
      const url = request.url();
      // Ignore external resources and favicons
      if (url.includes('localhost:3000') && !url.includes('favicon')) {
        failedRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // No critical local assets should fail to load
    expect(failedRequests).toHaveLength(0);
  });

  test('navigation from homepage to login works', async ({ page }) => {
    await page.goto('/');

    // Click Sign In
    await page.locator('a:has-text("Sign In")').first().click();

    // Should navigate to login page
    await expect(page).toHaveURL(/login/);

    // Wait for page to load and verify login form
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('navigation from homepage to signup works', async ({ page }) => {
    await page.goto('/');

    // Click Get Started
    await page.locator('a:has-text("Get Started")').first().click();

    // Should navigate to signup page
    await expect(page).toHaveURL(/signup/);
  });
});
