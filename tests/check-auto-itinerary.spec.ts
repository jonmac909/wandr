import { test, expect } from '@playwright/test';

test('check auto-itinerary view shows after planning', async ({ page }) => {
  // Clear storage and go to plan page
  await page.goto('https://wandr.jon-c95.workers.dev/plan');
  await page.evaluate(() => {
    localStorage.clear();
    indexedDB.deleteDatabase('TravelerDB');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Take screenshot of initial state
  await page.screenshot({ path: 'test-results/01-plan-start.png', fullPage: true });
  console.log('Step 1: Where & When');

  // Find the Countries/Regions input and type Japan
  const countryInput = page.getByPlaceholder('e.g., Thailand, Vietnam, Japan...');
  if (await countryInput.isVisible().catch(() => false)) {
    await countryInput.fill('Japan');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: 'test-results/02-destination.png', fullPage: true });

  // Click Next (the main form button, not the stepper arrow)
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.waitForTimeout(1000);

  console.log('Step 2: Preferences');
  await page.screenshot({ path: 'test-results/03-preferences.png', fullPage: true });

  // Click Next on preferences
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.waitForTimeout(1000);

  console.log('Step 3: Cities');
  await page.screenshot({ path: 'test-results/04-cities.png', fullPage: true });

  // Select Tokyo city if there's a grid
  const tokyoCity = page.getByText('Tokyo').first();
  if (await tokyoCity.isVisible().catch(() => false)) {
    await tokyoCity.click();
    await page.waitForTimeout(500);
  }

  // Click Next/Confirm
  const nextBtn = page.getByRole('button', { name: /Next|Confirm/i }).first();
  if (await nextBtn.isVisible().catch(() => false)) {
    await nextBtn.click();
    await page.waitForTimeout(1000);
  }

  console.log('Step 4: Route');
  await page.screenshot({ path: 'test-results/05-route.png', fullPage: true });

  // Confirm route
  const confirmBtn = page.getByRole('button', { name: /Confirm|Next|Done/i }).first();
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
    await page.waitForTimeout(2000);
  }

  console.log('Step 5: Itinerary');
  await page.screenshot({ path: 'test-results/06-itinerary.png', fullPage: true });

  // Check what's showing
  const pageContent = await page.locator('body').innerText();
  console.log('Itinerary content:', pageContent.substring(0, 1500));

  // Indicators
  const hasOldView = pageContent.includes('Tap to add favorites') || pageContent.includes('Trip Overview');
  const hasNewView = pageContent.includes('Day 1') || pageContent.includes('Grand Palace') ||
                     pageContent.includes('Generating') || pageContent.includes('nights');

  console.log('\n=== RESULT ===');
  console.log('OLD view (Trip Overview):', hasOldView);
  console.log('NEW view (Auto-itinerary):', hasNewView);
});
