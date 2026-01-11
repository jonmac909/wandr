import { test, expect } from '@playwright/test';

test('check planning view UI changes', async ({ page }) => {
  // Go to the deployed site
  await page.goto('https://wandr.jon-c95.workers.dev');

  // Take a screenshot of homepage
  await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });

  // Try to navigate to a trip page or create a new trip
  await page.goto('https://wandr.jon-c95.workers.dev/plan');
  await page.waitForLoadState('networkidle');

  // Take screenshot of plan page
  await page.screenshot({ path: 'test-results/plan-page.png', fullPage: true });

  // Log what we see on the page
  const pageContent = await page.content();
  console.log('Page title:', await page.title());

  // Check for specific elements
  const hasPickCities = await page.getByText('Pick your cities').isVisible().catch(() => false);
  const hasDraftBadge = await page.getByText('draft').isVisible().catch(() => false);

  console.log('Has "Pick your cities":', hasPickCities);
  console.log('Has "draft" badge:', hasDraftBadge);
});
