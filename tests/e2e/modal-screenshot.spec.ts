import { test } from '@playwright/test';

test('capture city modal screenshot', async ({ page }) => {
  // Go to an existing trip with cities
  await page.goto('https://wandr.jon-c95.workers.dev/trip/test-hawaii');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take screenshot of the page
  await page.screenshot({ path: 'test-results/trip-page.png', fullPage: true });
});
