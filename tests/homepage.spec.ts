import { test, expect } from '@playwright/test';

const BASE_URL = 'https://trippified.jon-c95.workers.dev';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check page title or main content loaded
    await expect(page).toHaveTitle(/wandr|trippified/i);
  });

  test('has navigation elements', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for key navigation elements
    await expect(page.locator('header')).toBeVisible();
  });

  test('plan page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/plan`);

    // Should load without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('my-trips page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/my-trips`);

    // Should load without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('explore page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/explore`);

    // Should load without crashing
    await expect(page.locator('body')).toBeVisible();
  });
});
