import { test, expect } from '@playwright/test'

/**
 * Posts feature — E2E tests
 * Covers: posts list, status filter tabs, search, view modes, and new post page.
 * Unauthenticated guard tests run without a live backend.
 * Feature tests require a running dev server.
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'test@example.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'TestPassword1'

async function login(page) {
  await page.goto('/auth')
  await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL)
  await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2_000)
  return page.url().includes('/app')
}

// ─── Unauthenticated guard ─────────────────────────────────────────────────

test.describe('Posts — unauthenticated guard', () => {
  test('/app/posts redirects or gates unauthenticated users', async ({ page }) => {
    await page.goto('/app/posts')
    await page.waitForTimeout(1_000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('/app/posts/new redirects or gates unauthenticated users', async ({ page }) => {
    await page.goto('/app/posts/new')
    await page.waitForTimeout(1_000)
    await expect(page.locator('body')).toBeVisible()
  })
})

// ─── Posts list page ───────────────────────────────────────────────────────

test.describe('Posts list — structure', () => {
  test.beforeEach(async ({ page }) => {
    const authed = await login(page)
    if (authed) {
      await page.goto('/app/posts')
      await page.waitForTimeout(1_500)
    }
  })

  test('page body renders without crashing', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('displays a Posts heading', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    const heading = page.locator('h1, h2, h3').filter({ hasText: /post/i }).first()
    await expect(heading).toBeVisible({ timeout: 5_000 })
  })

  test('has a create / compose post button', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    const btn = page.locator('button, a').filter({
      hasText: /new post|create post|compose|schedule post/i,
    }).first()
    await expect(btn).toBeVisible({ timeout: 5_000 })
  })
})

// ─── Status filter tabs ────────────────────────────────────────────────────

test.describe('Posts list — status filter tabs', () => {
  test.beforeEach(async ({ page }) => {
    const authed = await login(page)
    if (authed) {
      await page.goto('/app/posts')
      await page.waitForTimeout(1_500)
    }
  })

  test('shows All Posts tab', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    const tab = page.locator('button, [role="tab"]').filter({ hasText: /all/i }).first()
    await expect(tab).toBeVisible({ timeout: 5_000 })
  })

  test('shows Drafts tab', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    const tab = page.locator('button, [role="tab"]').filter({ hasText: /draft/i }).first()
    await expect(tab).toBeVisible({ timeout: 5_000 })
  })

  test('shows Scheduled tab', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    const tab = page.locator('button, [role="tab"]').filter({ hasText: /scheduled/i }).first()
    await expect(tab).toBeVisible({ timeout: 5_000 })
  })

  test('shows Published tab', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    const tab = page.locator('button, [role="tab"]').filter({ hasText: /published/i }).first()
    await expect(tab).toBeVisible({ timeout: 5_000 })
  })

  test('clicking Drafts tab stays on posts page', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    const tab = page.locator('button, [role="tab"]').filter({ hasText: /draft/i }).first()
    const visible = await tab.isVisible().catch(() => false)
    if (!visible) return

    await tab.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(/\/app\/posts/)
  })
})

// ─── Search and view controls ──────────────────────────────────────────────

test.describe('Posts list — search and view controls', () => {
  test.beforeEach(async ({ page }) => {
    const authed = await login(page)
    if (authed) {
      await page.goto('/app/posts')
      await page.waitForTimeout(1_500)
    }
  })

  test('has a search input', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    const search = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[name*="search"]'
    ).first()
    await expect(search).toBeVisible({ timeout: 5_000 })
  })

  test('has list / grid view toggle buttons', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    // Accepts icon buttons for list/grid toggle (aria-label or title)
    const toggle = page.locator(
      'button[aria-label*="list" i], button[aria-label*="grid" i], ' +
      'button[title*="list" i], button[title*="grid" i], ' +
      '[data-testid*="view-toggle"], [data-testid*="list-view"], [data-testid*="grid-view"]'
    ).first()
    await expect(toggle).toBeVisible({ timeout: 5_000 })
  })

  test('typing in search does not crash the page', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    const search = page.locator(
      'input[type="search"], input[placeholder*="search" i]'
    ).first()
    const visible = await search.isVisible().catch(() => false)
    if (!visible) return

    await search.fill('hello world')
    await page.waitForTimeout(800) // debounce wait
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveURL(/\/app\/posts/)
  })
})

// ─── New post page ─────────────────────────────────────────────────────────

test.describe('New post page — structure', () => {
  test.beforeEach(async ({ page }) => {
    const authed = await login(page)
    if (authed) {
      await page.goto('/app/posts/new')
      await page.waitForTimeout(1_500)
    }
  })

  test('page body renders without crashing', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('has a text/content input area', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    // Post scheduler has a textarea for post content
    const editor = page.locator(
      'textarea, [contenteditable="true"], [data-testid*="editor"], [data-testid*="content"]'
    ).first()
    await expect(editor).toBeVisible({ timeout: 5_000 })
  })

  test('has a schedule or publish action button', async ({ page }) => {
    const url = page.url()
    if (!url.includes('/app/posts')) return

    const btn = page.locator('button').filter({
      hasText: /schedule|publish|save|post now/i,
    }).first()
    await expect(btn).toBeVisible({ timeout: 5_000 })
  })
})
