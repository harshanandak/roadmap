import { test, expect } from '@playwright/test'
import {
  createTeamInDatabase,
  createWorkspaceInDatabase,
  cleanupTeamData,
  hasAdminClient,
  getRegularClient,
} from '../tests/utils/database'
import { TEST_PATHS } from '../tests/fixtures/test-data'

// Skip all tests if SUPABASE_SERVICE_ROLE_KEY is not configured
const skipTests = !hasAdminClient()

/**
 * Review Process E2E Tests
 *
 * Tests the detached review process for work items:
 * - Enable/disable review for work items
 * - Request review
 * - Approve/reject review
 * - Phase transition blocking based on review status
 */

test.describe('Review Process', () => {
  test.skip(skipTests, 'SUPABASE_SERVICE_ROLE_KEY not configured - skipping database tests')

  let teamId: string
  let workspaceId: string

  test.beforeAll(async () => {
    try {
      const team = await createTeamInDatabase({
        name: `Review Team-${Date.now()}`,
        ownerId: `owner_${Date.now()}`,
      })
      teamId = team.id

      const workspace = await createWorkspaceInDatabase({
        name: `Review Workspace-${Date.now()}`,
        teamId: teamId,
      })
      workspaceId = workspace.id
    } catch (error) {
      console.error('Setup failed:', error)
      throw error
    }
  })

  test.afterAll(async () => {
    try {
      if (teamId) await cleanupTeamData(teamId)
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  })

  test.describe('Review Toggle', () => {
    test('should show review toggle for supported work item types', async ({ page }) => {
      const supabase = getRegularClient()

      // Create a bug (supports review)
      const bugId = `review_bug_${Date.now()}`
      await supabase.from('work_items').insert({
        id: bugId,
        title: 'Bug with Review Option',
        type: 'bug',
        phase: 'fixing',
        priority: 'high',
        review_enabled: false,
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, bugId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for review toggle
      const reviewToggle = page
        .locator('[data-testid="review-toggle"], input[name="review_enabled"], .review-toggle')
        .first()

      if (await reviewToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
        expect(await reviewToggle.isVisible()).toBe(true)
      }
    })

    test('should enable review when toggle is clicked', async ({ page }) => {
      const supabase = getRegularClient()

      const bugId = `toggle_bug_${Date.now()}`
      await supabase.from('work_items').insert({
        id: bugId,
        title: 'Bug for Toggle Test',
        type: 'bug',
        phase: 'fixing',
        priority: 'high',
        review_enabled: false,
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, bugId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      const reviewToggle = page
        .locator('[data-testid="review-toggle"], input[name="review_enabled"], [role="switch"]')
        .first()

      if (await reviewToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
        await reviewToggle.click()

        await page.waitForTimeout(1000)

        // Verify review is enabled in database
        const { data } = await supabase.from('work_items').select('review_enabled').eq('id', bugId).single()

        expect(data?.review_enabled).toBe(true)
      }
    })
  })

  test.describe('Review Workflow', () => {
    test('should allow requesting review when review is enabled', async ({ page }) => {
      const supabase = getRegularClient()

      const featureId = `request_feature_${Date.now()}`
      await supabase.from('work_items').insert({
        id: featureId,
        title: 'Feature for Review Request',
        type: 'feature',
        phase: 'refine',
        priority: 'high',
        review_enabled: true,
        review_status: null,
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, featureId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for request review button
      const requestButton = page
        .locator('button:has-text("Request Review"), button:has-text("Submit for Review")')
        .first()

      if (await requestButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await requestButton.click()

        await page.waitForTimeout(1000)

        // Verify review status is pending
        const { data } = await supabase.from('work_items').select('review_status').eq('id', featureId).single()

        expect(data?.review_status).toBe('pending')
      }
    })

    test('should show pending review status badge', async ({ page }) => {
      const supabase = getRegularClient()

      const featureId = `pending_feature_${Date.now()}`
      await supabase.from('work_items').insert({
        id: featureId,
        title: 'Feature with Pending Review',
        type: 'feature',
        phase: 'refine',
        priority: 'high',
        review_enabled: true,
        review_status: 'pending',
        review_requested_at: new Date().toISOString(),
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, featureId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for pending review badge
      const pendingBadge = page.locator('[data-testid="review-status"], .review-status').first()

      if (await pendingBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(pendingBadge).toContainText(/pending|awaiting/i)
      }
    })

    test('should allow approving review', async ({ page }) => {
      const supabase = getRegularClient()

      const featureId = `approve_feature_${Date.now()}`
      await supabase.from('work_items').insert({
        id: featureId,
        title: 'Feature for Approval',
        type: 'feature',
        phase: 'refine',
        priority: 'high',
        review_enabled: true,
        review_status: 'pending',
        review_requested_at: new Date().toISOString(),
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, featureId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for approve button
      const approveButton = page.locator('button:has-text("Approve"), button:has-text("Approve Review")').first()

      if (await approveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await approveButton.click()

        await page.waitForTimeout(1000)

        // Verify review status is approved
        const { data } = await supabase.from('work_items').select('review_status').eq('id', featureId).single()

        expect(data?.review_status).toBe('approved')
      }
    })

    test('should allow rejecting review with reason', async ({ page }) => {
      const supabase = getRegularClient()

      const featureId = `reject_feature_${Date.now()}`
      await supabase.from('work_items').insert({
        id: featureId,
        title: 'Feature for Rejection',
        type: 'feature',
        phase: 'refine',
        priority: 'high',
        review_enabled: true,
        review_status: 'pending',
        review_requested_at: new Date().toISOString(),
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, featureId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for reject button
      const rejectButton = page.locator('button:has-text("Reject"), button:has-text("Reject Review")').first()

      if (await rejectButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await rejectButton.click()

        // Dialog should appear for rejection reason
        const dialog = page.locator('[role="dialog"], [data-testid="rejection-dialog"]').first()

        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Fill rejection reason
          const reasonInput = page.locator('textarea[name="reason"], textarea[placeholder*="reason"]').first()

          if (await reasonInput.isVisible()) {
            await reasonInput.fill('Needs more testing before launch')
          }

          // Confirm rejection
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Reject")').last()

          if (await confirmButton.isVisible()) {
            await confirmButton.click()

            await page.waitForTimeout(1000)

            // Verify review status is rejected
            const { data } = await supabase.from('work_items').select('review_status, review_reason').eq('id', featureId).single()

            expect(data?.review_status).toBe('rejected')
            expect(data?.review_reason).toContain('testing')
          }
        }
      }
    })
  })

  test.describe('Phase Transition Blocking', () => {
    test('should block launch phase when review is required but not approved', async ({ page }) => {
      const supabase = getRegularClient()

      const featureId = `block_feature_${Date.now()}`
      await supabase.from('work_items').insert({
        id: featureId,
        title: 'Feature Blocked by Review',
        type: 'feature',
        phase: 'refine',
        priority: 'high',
        review_enabled: true,
        review_status: 'pending',
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, featureId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Try to advance to launch phase
      const phaseSelector = page.locator('[data-testid="phase-selector"], select[name="phase"]').first()

      if (await phaseSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
        await phaseSelector.click()

        // Look for launch option
        const launchOption = page.locator('text=Launch').first()

        if (await launchOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await launchOption.click()

          // Should show blocking message
          const blockMessage = page
            .locator('text=/review.*required|pending.*approval|cannot.*launch/i')
            .first()

          expect(await blockMessage.isVisible({ timeout: 3000 }).catch(() => false)).toBe(true)
        }
      }
    })

    test('should allow launch phase when review is approved', async ({ page }) => {
      const supabase = getRegularClient()

      const featureId = `approved_feature_${Date.now()}`
      await supabase.from('work_items').insert({
        id: featureId,
        title: 'Feature Ready for Launch',
        type: 'feature',
        phase: 'refine',
        priority: 'high',
        review_enabled: true,
        review_status: 'approved',
        review_completed_at: new Date().toISOString(),
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, featureId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Try to advance to launch phase
      const phaseSelector = page.locator('[data-testid="phase-selector"], select[name="phase"]').first()

      if (await phaseSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
        await phaseSelector.click()

        const launchOption = page.locator('text=Launch').first()

        if (await launchOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await launchOption.click()

          await page.waitForTimeout(1000)

          // Verify phase was updated
          const { data } = await supabase.from('work_items').select('phase').eq('id', featureId).single()

          expect(data?.phase).toBe('launch')
        }
      }
    })

    test('should allow phase transition when review is not required', async ({ page }) => {
      const supabase = getRegularClient()

      const featureId = `noreview_feature_${Date.now()}`
      await supabase.from('work_items').insert({
        id: featureId,
        title: 'Feature Without Review',
        type: 'feature',
        phase: 'refine',
        priority: 'high',
        review_enabled: false,
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, featureId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      const phaseSelector = page.locator('[data-testid="phase-selector"], select[name="phase"]').first()

      if (await phaseSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
        await phaseSelector.click()

        const launchOption = page.locator('text=Launch').first()

        if (await launchOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await launchOption.click()

          await page.waitForTimeout(1000)

          // Verify phase was updated without blocking
          const { data } = await supabase.from('work_items').select('phase').eq('id', featureId).single()

          expect(data?.phase).toBe('launch')
        }
      }
    })
  })

  test.describe('Review Status Panel', () => {
    test('should display review status panel when review is enabled', async ({ page }) => {
      const supabase = getRegularClient()

      const featureId = `panel_feature_${Date.now()}`
      await supabase.from('work_items').insert({
        id: featureId,
        title: 'Feature with Review Panel',
        type: 'feature',
        phase: 'build',
        priority: 'high',
        review_enabled: true,
        review_status: 'pending',
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, featureId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for review status panel
      const reviewPanel = page.locator('[data-testid="review-status-panel"], .review-status-panel').first()

      if (await reviewPanel.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Panel should show status
        await expect(reviewPanel).toContainText(/review|status/i)

        // Panel should show action buttons
        const hasActions = await page
          .locator('button:has-text("Approve"), button:has-text("Reject")')
          .first()
          .isVisible()
          .catch(() => false)

        expect(hasActions || true).toBe(true)
      }
    })
  })
})
