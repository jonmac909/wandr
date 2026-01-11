import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Trippified/i);
});

test('can navigate to plan page', async ({ page }) => {
  await page.goto('/');
  // Click any link/button that takes us to /plan
  await page.getByText(/plan.*trip/i).first().click();
  await expect(page).toHaveURL(/\/plan/);
});

test('plan page loads correctly', async ({ page }) => {
  await page.goto('/plan');
  await page.waitForLoadState('networkidle');
  // Check if the page has the expected content
  await expect(page.locator('body')).toBeVisible();
});
