import { test, expect } from '@playwright/test';

test('check trip planning view', async ({ page }) => {
  // Go to a trip page - this is where SwipeablePlanningView shows
  await page.goto('https://wandr.jon-c95.workers.dev/trip/test-trip');
  await page.waitForTimeout(3000); // Wait for page to load

  // Take screenshot
  await page.screenshot({ path: 'test-results/trip-view.png', fullPage: true });

  console.log('Page title:', await page.title());
  console.log('Current URL:', page.url());

  // Check what's visible
  const bodyText = await page.locator('body').textContent();
  console.log('Page content preview:', bodyText?.slice(0, 500));
});
