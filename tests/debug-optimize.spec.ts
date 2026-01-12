import { test, expect } from '@playwright/test';

test('debug optimize route', async ({ page }) => {
  // Go to the live site
  await page.goto('https://wandr.jon-c95.workers.dev/plan');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Log what we see
  console.log('Page title:', await page.title());
  
  // Check if there's a trip we can access - look for any existing trips
  const hasTrips = await page.locator('text=Route').count();
  console.log('Has Route text:', hasTrips);
  
  // Try to navigate to step 4 (Route)
  const routeButton = page.locator('button:has-text("Route"), [data-step="route"]').first();
  if (await routeButton.count() > 0) {
    await routeButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Look for optimize route button
  const optimizeButton = page.locator('button:has-text("Optimize Route")');
  console.log('Optimize Route button count:', await optimizeButton.count());
  
  // Look for country order section
  const countryOrder = page.locator('text=Country order');
  console.log('Country order section count:', await countryOrder.count());
  
  // Take a screenshot
  await page.screenshot({ path: 'tests/debug-optimize.png', fullPage: true });
  
  console.log('Screenshot saved to tests/debug-optimize.png');
});
