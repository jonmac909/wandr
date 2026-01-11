import { test, expect } from '@playwright/test';

test('check specific trip page', async ({ page }) => {
  await page.goto('https://wandr.jon-c95.workers.dev/trip/38af4399-2780-4ff5-a906-411835198f56');
  await page.waitForTimeout(5000); // Wait for page to fully load

  // Take screenshot
  await page.screenshot({ path: 'test-results/turkey-spain-trip.png', fullPage: true });

  console.log('Page title:', await page.title());
  console.log('Current URL:', page.url());

  // Check for UI elements
  const hasPickCities = await page.getByText('Pick your cities').isVisible().catch(() => false);
  const hasDraftBadge = await page.getByText('draft').isVisible().catch(() => false);
  const hasTurkeyTab = await page.getByText('Turkey').isVisible().catch(() => false);
  const hasSpainTab = await page.getByText('Spain').isVisible().catch(() => false);
  const hasYourFavs = await page.getByText('Your favs').isVisible().catch(() => false);

  console.log('Has "Pick your cities":', hasPickCities);
  console.log('Has "draft" badge:', hasDraftBadge);
  console.log('Has "Turkey" tab:', hasTurkeyTab);
  console.log('Has "Spain" tab:', hasSpainTab);
  console.log('Has "Your favs":', hasYourFavs);

  // Get page content preview
  const bodyText = await page.locator('body').textContent();
  console.log('Page content preview:', bodyText?.slice(0, 1000));
});
