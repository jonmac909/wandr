import { test, expect } from '@playwright/test';

test('debug route - select cities and check route step', async ({ page }) => {
  // Go directly to an existing trip to test the planning flow
  // First create a trip via /plan
  await page.goto('https://wandr.jon-c95.workers.dev/plan');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Enter destination
  const destinationInput = page.getByPlaceholder(/Thailand, Vietnam, Japan/i);
  await destinationInput.fill('Japan');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  // Click Next to go to step 2
  await page.getByRole('button', { name: /Next/i }).first().click();
  await page.waitForTimeout(500);

  // Take screenshot of step 2
  await page.screenshot({ path: 'test-results/debug-step2-tripstyle.png', fullPage: true });

  // Select trip types in step 2 - click on some type buttons
  // These are the trip type buttons like "Adventure", "Relaxation", etc.
  const tripTypeButtons = page.locator('button').filter({ hasText: /Adventure|Culture|Beach|Food|Nature/i });
  const typeCount = await tripTypeButtons.count();
  console.log('Trip type buttons found:', typeCount);

  if (typeCount > 0) {
    await tripTypeButtons.first().click();
    await page.waitForTimeout(300);
    console.log('Selected first trip type');
  }

  // Click Next to go to step 3
  await page.getByRole('button', { name: /Next/i }).click();
  await page.waitForTimeout(500);

  // Take screenshot before clicking save
  await page.screenshot({ path: 'test-results/debug-before-save.png', fullPage: true });

  // Click Save & Start Planning (should now be enabled)
  const saveButton = page.getByRole('button', { name: /Save.*Start Planning/i });
  await saveButton.click({ force: true });
  await page.waitForTimeout(3000);

  // Take screenshot of cities step
  await page.screenshot({ path: 'test-results/debug-step1-cities.png', fullPage: true });

  // Check if we're on the planning page with cities
  const citiesHeading = page.locator('text=Pick your cities');
  const hasCitiesHeading = await citiesHeading.count() > 0;
  console.log('Has "Pick your cities" heading:', hasCitiesHeading);

  // Wait for city cards to load
  await page.waitForTimeout(2000);

  // Find heart buttons to select cities (not the card itself which opens modal)
  const heartButtons = page.locator('button').filter({ has: page.locator('svg.lucide-heart') });
  const heartCount = await heartButtons.count();
  console.log('Heart buttons found:', heartCount);

  // Select first 3 cities by clicking their heart buttons
  for (let i = 0; i < Math.min(3, heartCount); i++) {
    const heart = heartButtons.nth(i);
    await heart.click();
    await page.waitForTimeout(300);
    console.log(`Selected city ${i + 1}`);
  }

  await page.screenshot({ path: 'test-results/debug-cities-selected.png', fullPage: true });

  // Look for the "Plan Route" or "Next" button to go to route step
  const nextButton = page.getByRole('button', { name: /Route|Next|Plan Route/i });
  const hasNextButton = await nextButton.count() > 0;
  console.log('Has Next/Route button:', hasNextButton);

  if (hasNextButton) {
    await nextButton.first().click();
    await page.waitForTimeout(1000);
  }

  // Take screenshot of route step
  await page.screenshot({ path: 'test-results/debug-step2-route.png', fullPage: true });

  // Check what's shown
  const routeHeading = page.locator('text=Plan Your Route');
  const hasRouteHeading = await routeHeading.count() > 0;
  console.log('Has "Plan Your Route" heading:', hasRouteHeading);

  // Check city count
  const cityCountText = await page.locator('text=/\\d+ cities/').textContent().catch(() => 'not found');
  console.log('City count text:', cityCountText);
});
