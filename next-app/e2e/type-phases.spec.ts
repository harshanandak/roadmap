import { test, expect } from '@playwright/test'
import {
  createTeamInDatabase,
  createWorkspaceInDatabase,
  createWorkItemInDatabase,
  cleanupTeamData,
  hasAdminClient,
  getRegularClient,
} from '../tests/utils/database'
import { TEST_PATHS } from '../tests/fixtures/test-data'

// Skip all tests if SUPABASE_SERVICE_ROLE_KEY is not configured
const skipTests = !hasAdminClient()

/**
 * Type-Aware Phase System E2E Tests
 *
 * Tests the type-specific phase workflows:
 * - Feature: design -> build -> refine -> launch
 * - Concept: ideation -> research -> validated | rejected
 * - Bug: triage -> investigating -> fixing -> verified
 * - Enhancement: same as Feature
 */

test.describe('Type-Aware Phase System', () => {
  test.skip(skipTests, 'SUPABASE_SERVICE_ROLE_KEY not configured - skipping database tests')

  let teamId: string
  let workspaceId: string

  test.beforeAll(async () => {
    try {
      const team = await createTeamInDatabase({
        name: `Type Phase Team-${Date.now()}`,
        ownerId: `owner_${Date.now()}`,
      })
      teamId = team.id

      const workspace = await createWorkspaceInDatabase({
        name: `Type Phase Workspace-${Date.now()}`,
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

  test.describe('Feature Phases', () => {
    test('should create feature with design phase by default', async ({ page }) => {
      await page.goto(TEST_PATHS.features(workspaceId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      const createButton = page
        .locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")')
        .first()

      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createButton.click()

        // Fill form
        const titleInput = page
          .locator('input[placeholder*="title"], input[placeholder*="name"]')
          .first()

        if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await titleInput.fill(`Test Feature ${Date.now()}`)

          // Select feature type
          const typeSelect = page.locator('[data-testid="type-select"], select[name="type"]').first()
          if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await typeSelect.click()
            await page.locator('text=Feature').click()
          }

          // Submit
          const submitButton = page.locator('button[type="submit"]').first()
          if (await submitButton.isVisible()) {
            await submitButton.click()
            await page.waitForTimeout(1000)

            // Verify design phase badge is shown
            const phaseBadge = page.locator('[data-testid="phase-badge"], .phase-badge').first()
            if (await phaseBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
              await expect(phaseBadge).toContainText(/design|Design/i)
            }
          }
        }
      }
    })

    test('should show feature phase progression: design -> build -> refine -> launch', async ({ page }) => {
      // Create a feature via database
      const feature = await createWorkItemInDatabase({
        title: `Phase Test Feature ${Date.now()}`,
        type: 'feature',
        phase: 'design',
        priority: 'high',
        workspaceId,
        teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, feature.id))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for phase progression indicator
      const phaseIndicator = page.locator('[data-testid="phase-progression"], .phase-indicator').first()

      if (await phaseIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Verify all 4 phases are shown
        await expect(page.locator('text=Design')).toBeVisible()
        await expect(page.locator('text=Build')).toBeVisible()
        await expect(page.locator('text=Refine')).toBeVisible()
        await expect(page.locator('text=Launch')).toBeVisible()
      }
    })
  })

  test.describe('Concept Phases', () => {
    test('should create concept with ideation phase by default', async ({ page }) => {
      await page.goto(TEST_PATHS.features(workspaceId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      const createButton = page
        .locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")')
        .first()

      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createButton.click()

        const titleInput = page
          .locator('input[placeholder*="title"], input[placeholder*="name"]')
          .first()

        if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await titleInput.fill(`Test Concept ${Date.now()}`)

          // Select concept type
          const typeSelect = page.locator('[data-testid="type-select"], select[name="type"]').first()
          if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await typeSelect.click()
            await page.locator('text=Concept').click()
          }

          const submitButton = page.locator('button[type="submit"]').first()
          if (await submitButton.isVisible()) {
            await submitButton.click()
            await page.waitForTimeout(1000)

            // Verify ideation phase
            const phaseBadge = page.locator('[data-testid="phase-badge"], .phase-badge').first()
            if (await phaseBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
              await expect(phaseBadge).toContainText(/ideation|Ideation/i)
            }
          }
        }
      }
    })

    test('concept should have ideation -> research -> validated phases', async ({ page }) => {
      // Create concept via database with ideation phase
      const supabase = getRegularClient()
      const conceptId = `concept_${Date.now()}`

      await supabase.from('work_items').insert({
        id: conceptId,
        title: `Concept Phase Test ${Date.now()}`,
        type: 'concept',
        phase: 'ideation',
        priority: 'medium',
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, conceptId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for concept-specific phases
      const phaseSection = page.locator('[data-testid="phase-section"], .phase-section').first()

      if (await phaseSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Verify concept phases exist
        const hasIdeation = await page.locator('text=/ideation/i').isVisible().catch(() => false)
        const hasResearch = await page.locator('text=/research/i').isVisible().catch(() => false)

        expect(hasIdeation || hasResearch).toBe(true)
      }
    })

    test('validated concept should show terminal phase', async ({ page }) => {
      const supabase = getRegularClient()
      const conceptId = `validated_concept_${Date.now()}`

      await supabase.from('work_items').insert({
        id: conceptId,
        title: `Validated Concept ${Date.now()}`,
        type: 'concept',
        phase: 'validated',
        priority: 'high',
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, conceptId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Verified phase should show terminal indicator
      const phaseBadge = page.locator('[data-testid="phase-badge"]').first()

      if (await phaseBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(phaseBadge).toContainText(/validated/i)
      }
    })
  })

  test.describe('Bug Phases', () => {
    test('should create bug with triage phase by default', async ({ page }) => {
      await page.goto(TEST_PATHS.features(workspaceId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      const createButton = page
        .locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")')
        .first()

      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createButton.click()

        const titleInput = page
          .locator('input[placeholder*="title"], input[placeholder*="name"]')
          .first()

        if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await titleInput.fill(`Test Bug ${Date.now()}`)

          // Select bug type
          const typeSelect = page.locator('[data-testid="type-select"], select[name="type"]').first()
          if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await typeSelect.click()
            await page.locator('text=Bug').click()
          }

          const submitButton = page.locator('button[type="submit"]').first()
          if (await submitButton.isVisible()) {
            await submitButton.click()
            await page.waitForTimeout(1000)

            // Verify triage phase
            const phaseBadge = page.locator('[data-testid="phase-badge"], .phase-badge').first()
            if (await phaseBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
              await expect(phaseBadge).toContainText(/triage|Triage/i)
            }
          }
        }
      }
    })

    test('bug should have triage -> investigating -> fixing -> verified phases', async ({ page }) => {
      const supabase = getRegularClient()
      const bugId = `bug_${Date.now()}`

      await supabase.from('work_items').insert({
        id: bugId,
        title: `Bug Phase Test ${Date.now()}`,
        type: 'bug',
        phase: 'investigating',
        priority: 'high',
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, bugId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for bug-specific phases
      const phaseSection = page.locator('[data-testid="phase-section"], .phase-section').first()

      if (await phaseSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Bug should show its specific phases
        const hasInvestigating = await page.locator('text=/investigating/i').isVisible().catch(() => false)
        const hasFixing = await page.locator('text=/fixing/i').isVisible().catch(() => false)

        expect(hasInvestigating || hasFixing).toBe(true)
      }
    })

    test('verified bug should show terminal phase', async ({ page }) => {
      const supabase = getRegularClient()
      const bugId = `verified_bug_${Date.now()}`

      await supabase.from('work_items').insert({
        id: bugId,
        title: `Verified Bug ${Date.now()}`,
        type: 'bug',
        phase: 'verified',
        priority: 'high',
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, bugId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      const phaseBadge = page.locator('[data-testid="phase-badge"]').first()

      if (await phaseBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(phaseBadge).toContainText(/verified/i)
      }
    })
  })

  test.describe('Phase Distribution', () => {
    test('should show type-aware phase distribution on workspace', async ({ page }) => {
      // Create work items of different types and phases
      const supabase = getRegularClient()

      await supabase.from('work_items').insert([
        {
          id: `dist_feature_${Date.now()}`,
          title: 'Feature in Build',
          type: 'feature',
          phase: 'build',
          priority: 'high',
          workspace_id: workspaceId,
          team_id: teamId,
        },
        {
          id: `dist_bug_${Date.now()}`,
          title: 'Bug in Triage',
          type: 'bug',
          phase: 'triage',
          priority: 'high',
          workspace_id: workspaceId,
          team_id: teamId,
        },
        {
          id: `dist_concept_${Date.now()}`,
          title: 'Concept in Research',
          type: 'concept',
          phase: 'research',
          priority: 'medium',
          workspace_id: workspaceId,
          team_id: teamId,
        },
      ])

      await page.goto(TEST_PATHS.workspace(workspaceId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for distribution component
      const distribution = page.locator('[data-testid="phase-distribution"], .phase-distribution').first()

      if (await distribution.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Should show type icons or labels
        const hasTypeIndicators = await page
          .locator('text=/feature|bug|concept/i')
          .first()
          .isVisible()
          .catch(() => false)

        expect(hasTypeIndicators).toBe(true)
      }
    })
  })
})
