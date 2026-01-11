import { test, expect } from '@playwright/test';

test('plan page is responsive at mobile size', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('https://wandr.jon-c95.workers.dev/plan');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Take screenshot at mobile size
  await page.screenshot({ path: 'test-results/plan-mobile.png', fullPage: true });

  // Check page doesn't have horizontal scroll
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  console.log('Has horizontal scroll at mobile (375px):', hasHorizontalScroll);

  // Check that step indicators are visible
  const step1 = page.locator('text=Where & When');
  await expect(step1).toBeVisible();

  // Check heading is visible
  const heading = page.getByRole('heading', { name: 'Where are you going?' });
  await expect(heading).toBeVisible();

  // Check input field fits
  const input = page.getByPlaceholder(/Vancouver, Los Angeles/i);
  await expect(input).toBeVisible();

  // Get input bounding box
  const inputBox = await input.boundingBox();
  console.log('Input width at 375px viewport:', inputBox?.width);

  // Input should not overflow viewport (with some padding)
  if (inputBox) {
    expect(inputBox.x + inputBox.width).toBeLessThan(375);
  }

  expect(hasHorizontalScroll).toBe(false);
});

test('plan page is responsive at tablet size', async ({ page }) => {
  // Set tablet viewport
  await page.setViewportSize({ width: 768, height: 1024 });

  await page.goto('https://wandr.jon-c95.workers.dev/plan');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Take screenshot at tablet size
  await page.screenshot({ path: 'test-results/plan-tablet.png', fullPage: true });

  // Check page doesn't have horizontal scroll
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  console.log('Has horizontal scroll at tablet (768px):', hasHorizontalScroll);
  expect(hasHorizontalScroll).toBe(false);
});
