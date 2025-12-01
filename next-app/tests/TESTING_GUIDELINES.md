# Playwright E2E Testing Guidelines

**Last Updated**: 2025-11-30
**Project**: Product Lifecycle Management Platform
**Framework**: Playwright Test

---

## Quick Reference

### Running Tests

```bash
# Run all tests (all browsers)
npm run test:e2e

# Run specific test file
npx playwright test e2e/smoke.spec.ts

# Run single browser only
npx playwright test --project=chromium

# Run with UI mode (debugging)
npx playwright test --ui

# Run headed (visible browser)
npx playwright test --headed

# View test report
npx playwright show-report
```

### Test File Naming

| Pattern | Purpose |
|---------|---------|
| `smoke.spec.ts` | Basic health checks (homepage, navigation) |
| `01-auth.spec.ts` | Authentication flows |
| `02-multi-tenant-isolation.spec.ts` | Security isolation tests |
| `03-team-management.spec.ts` | Team CRUD operations |
| `XX-feature-name.spec.ts` | Feature-specific tests (numbered for ordering) |

---

## Anti-Patterns to Avoid

### 1. Silent Error Swallowing

**NEVER use `.catch(() => false)` patterns in tests.**

```typescript
// BAD: Silent failure masks real issues
const createSuccess = await createTeam().catch(() => false);
if (!createSuccess) {
  expect(true).toBe(true);  // NEVER DO THIS
  return;
}

// GOOD: Let errors surface
const team = await createTeam();
expect(team).toBeDefined();
expect(team.id).toBeTruthy();
```

**Why this matters:**
- Cascading timeouts (5 conditions × 5s timeout = 25s per test)
- Real errors get hidden
- Tests "pass" when features are actually broken
- Debugging becomes impossible

### 2. Trivial Assertions

**NEVER use `expect(true).toBe(true)` to make tests pass.**

```typescript
// BAD: Meaningless assertion
if (!element) {
  expect(true).toBe(true);
  return;
}

// GOOD: Either fail explicitly or skip with reason
if (!element) {
  test.fail(true, 'Element not found - feature may not be implemented');
  return;
}

// OR skip gracefully with explanation
test.skip(!element, 'Skipping: Dashboard requires authenticated user');
```

### 3. Heavy beforeAll Hooks

**Avoid complex setup in `beforeAll` - prefer `beforeEach`.**

```typescript
// BAD: Creates shared state, causes crashes on parallel runs
test.describe('Teams', () => {
  let sharedTeam: Team;

  test.beforeAll(async () => {
    sharedTeam = await createTeamViaAPI();  // Resource contention!
  });

  test('edit team', async () => {
    await editTeam(sharedTeam.id);  // Race condition!
  });
});

// GOOD: Each test is independent
test.describe('Teams', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('create team', async ({ page }) => {
    // Creates its own data, cleans up after
  });
});
```

### 4. Hardcoded IDs

**Never use fake UUIDs or hardcoded IDs.**

```typescript
// BAD: Fake IDs bypass actual auth/database
const fakeUserId = 'test-user-123';
await supabase.from('teams').insert({ owner_id: fakeUserId });

// GOOD: Use actual test fixtures from .env.test
const { TEST_USER_A_EMAIL, TEST_USER_A_PASSWORD } = process.env;
await loginWithCredentials(page, TEST_USER_A_EMAIL, TEST_USER_A_PASSWORD);
```

### 5. Unbounded Waits

**Always set explicit timeouts and use proper waiting strategies.**

```typescript
// BAD: Waits forever
await page.waitForSelector('.team-card');

// GOOD: Explicit timeout with descriptive error
await page.waitForSelector('.team-card', {
  timeout: 5000,
  state: 'visible'
});

// BETTER: Use Playwright's expect with timeout
await expect(page.locator('.team-card')).toBeVisible({ timeout: 5000 });
```

---

## Best Practices

### 1. Use Serial Mode for Dependent Tests

When tests must run in order (create → edit → delete):

```typescript
test.describe('Team Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let teamId: string;

  test('create team', async ({ page }) => {
    // Creates team, stores ID
    teamId = await createTeam(page);
    expect(teamId).toBeTruthy();
  });

  test('edit team', async ({ page }) => {
    // Uses teamId from previous test
    await editTeam(page, teamId);
  });

  test('delete team', async ({ page }) => {
    // Cleanup in final test
    await deleteTeam(page, teamId);
  });
});
```

### 2. Proper Authentication Pattern

```typescript
import { TEST_USERS } from '../tests/fixtures/test-data';

test.describe('Authenticated Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login once per test
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USERS.USER_A.email);
    await page.fill('input[name="password"]', TEST_USERS.USER_A.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|workspaces/);
  });

  test('can access dashboard', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });
});
```

### 3. Test Data Cleanup

Always clean up after tests, preferably in the test itself:

```typescript
test('can create and delete team', async ({ page }) => {
  // Arrange
  await loginAsTestUser(page);

  // Act - Create
  await page.click('[data-testid="new-team"]');
  await page.fill('[name="name"]', 'E2E Test Team');
  await page.click('button:has-text("Create")');

  // Assert - Created
  await expect(page.locator('text=E2E Test Team')).toBeVisible();

  // Cleanup - Delete (in same test)
  await page.click('[data-testid="team-menu"]');
  await page.click('text=Delete');
  await page.click('button:has-text("Confirm")');

  // Verify cleanup
  await expect(page.locator('text=E2E Test Team')).not.toBeVisible();
});
```

### 4. Meaningful Assertions

Every test should verify actual functionality:

```typescript
// Testing actual behavior
test('team creation shows in team list', async ({ page }) => {
  const teamName = `Test Team ${Date.now()}`;

  await createTeam(page, teamName);

  // Navigate to verify it persisted
  await page.goto('/teams');
  await expect(page.locator(`text=${teamName}`)).toBeVisible();

  // Verify metadata
  const teamCard = page.locator(`[data-team-name="${teamName}"]`);
  await expect(teamCard.locator('.member-count')).toHaveText('1 member');
  await expect(teamCard.locator('.owner-badge')).toBeVisible();
});
```

### 5. Cross-Browser Considerations

Design tests to work across all browsers:

```typescript
// Avoid browser-specific selectors
// BAD
await page.click('button::-webkit-scrollbar'); // WebKit only

// GOOD
await page.click('[data-testid="scroll-button"]');

// Handle browser differences explicitly
test('file upload works', async ({ page, browserName }) => {
  if (browserName === 'webkit' && process.platform === 'win32') {
    test.skip(true, 'File upload has known issues on WebKit+Windows');
  }

  await page.setInputFiles('[type="file"]', 'test.pdf');
});
```

---

## Test Categories

### Smoke Tests (smoke.spec.ts)

**Purpose**: Verify application is functional at a basic level.

**What to test**:
- Homepage loads with correct branding
- Navigation links work
- Login/Signup pages render
- Protected routes redirect unauthenticated users
- Static assets load without errors

**Run frequency**: Every deployment, all browsers.

### Authentication Tests (01-auth.spec.ts)

**Purpose**: Verify auth flows work end-to-end.

**What to test**:
- Signup creates account
- Login with valid credentials
- Login with invalid credentials shows error
- Logout clears session
- Protected routes require auth

### Security Tests (02-multi-tenant-isolation.spec.ts)

**Purpose**: Verify data isolation between tenants.

**What to test**:
- Cannot access other team's data via URL manipulation
- API returns 404/403 for unauthorized access
- Session isolation between users
- Error messages don't leak information

### Feature Tests (03-*.spec.ts)

**Purpose**: Test specific features work correctly.

**What to test**:
- CRUD operations complete successfully
- Data persists after page reload
- UI state reflects data accurately
- Error handling shows user-friendly messages

---

## Environment Setup

### Required Environment Variables

Create `.env.test` with these values:

```env
# Required - Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for admin operations (RLS bypass in test setup/teardown)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional - Pre-existing test accounts
TEST_USER_A_EMAIL=test-user-a@example.com
TEST_USER_A_PASSWORD=secure-password-123
TEST_USER_B_EMAIL=test-user-b@example.com
TEST_USER_B_PASSWORD=secure-password-456
```

### Getting Service Role Key

1. Go to Supabase Dashboard → Project Settings → API
2. Copy the `service_role` key (NOT the anon key)
3. Add to `.env.test` as `SUPABASE_SERVICE_ROLE_KEY`

**Security Note**: Never commit `.env.test` to version control. Add it to `.gitignore`.

---

## Global Setup and Teardown

### Global Setup (`tests/global-setup.ts`)

Runs once before all tests:
- Validates environment variables
- Checks Supabase connection
- Verifies browser installations
- Fails fast on missing configuration

### Global Teardown (`tests/global-teardown.ts`)

Runs once after all tests:
- Cleans up test teams (by name pattern)
- Removes test auth users (by email pattern)
- Deletes orphaned resources
- Prevents data accumulation

---

## Debugging Failed Tests

### 1. View Test Report

```bash
npx playwright show-report
```

### 2. Run with Trace Viewer

```bash
npx playwright test --trace on
```

Then open the trace file from the report.

### 3. Run Headed

```bash
npx playwright test --headed --project=chromium
```

### 4. Use UI Mode

```bash
npx playwright test --ui
```

### 5. Check Logs

Look for patterns in failure messages:
- **Timeout**: Increase timeouts or check selectors
- **Element not found**: Verify selector, check if element renders
- **Network error**: Check if dev server is running
- **Auth error**: Verify test credentials in `.env.test`

---

## Performance Guidelines

### Keep Tests Fast

| Test Type | Target Duration |
|-----------|-----------------|
| Smoke test | < 5s |
| Auth flow | < 10s |
| Feature CRUD | < 15s |
| Complex workflow | < 30s |

### Reduce Flakiness

1. Use explicit waits, never `page.waitForTimeout()`
2. Prefer `expect().toBeVisible()` over raw selectors
3. Use unique test data (timestamps in names)
4. Clean up test data in same test when possible
5. Run problematic tests in serial mode

---

## Checklist for New Tests

Before committing a new test file:

- [ ] No `.catch(() => false)` patterns
- [ ] No `expect(true).toBe(true)` assertions
- [ ] Uses `test.describe.configure({ mode: 'serial' })` if tests depend on each other
- [ ] Proper authentication in `beforeEach`
- [ ] Test data cleaned up (in test or via global teardown)
- [ ] Works in all browsers (Chromium, Firefox, WebKit)
- [ ] Descriptive test names
- [ ] Meaningful assertions that verify actual behavior
- [ ] Handles missing elements gracefully (skip vs fail)

---

## Reference Files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Main configuration (browsers, timeouts, reporters) |
| `tests/global-setup.ts` | Environment validation |
| `tests/global-teardown.ts` | Data cleanup |
| `tests/fixtures/test-data.ts` | Test user credentials, sample data |
| `tests/utils/database.ts` | Supabase admin client, helper functions |
| `e2e/*.spec.ts` | Test specifications |
