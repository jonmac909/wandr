import { test, expect } from '@playwright/test';

test('test city modal and route options', async ({ page }) => {
  // Go to the questionnaire to create a new trip
  await page.goto('https://wandr.jon-c95.workers.dev/plan');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'test-results/01-questionnaire.png', fullPage: true });

  // Fill in the questionnaire
  // 1. Enter destination in the Countries/Regions input
  const destinationInput = page.getByPlaceholder('Thailand, Vietnam, Japan');
  if (await destinationInput.isVisible()) {
    await destinationInput.fill('Japan');
    await page.waitForTimeout(500);

    // Click the + button next to the input
    const plusButton = page.locator('button svg.lucide-plus').locator('xpath=ancestor::button').first();
    if (await plusButton.isVisible()) {
      await plusButton.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'test-results/02-added-japan.png', fullPage: true });

    // Add Thailand
    await destinationInput.fill('Thailand');
    await page.waitForTimeout(500);
    await plusButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/03-added-thailand.png', fullPage: true });
  }

  // Click Next button
  const nextButton = page.locator('button').filter({ hasText: 'Next' });
  console.log(`Next button visible: ${await nextButton.isVisible()}`);
  console.log(`Next button enabled: ${await nextButton.isEnabled()}`);

  if (await nextButton.isVisible() && await nextButton.isEnabled()) {
    await nextButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/04-step2.png', fullPage: true });

    // Continue clicking Next through remaining steps
    for (let step = 0; step < 5; step++) {
      const next = page.locator('button').filter({ hasText: 'Next' }).or(page.locator('button').filter({ hasText: 'Save' }));
      if (await next.first().isVisible().catch(() => false) && await next.first().isEnabled().catch(() => false)) {
        console.log(`Clicking Next/Save on step ${step + 2}`);
        await next.first().click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `test-results/05-step${step + 3}.png`, fullPage: true });
      } else {
        console.log(`No more Next buttons at step ${step + 2}`);
        break;
      }
    }
  }

  await page.screenshot({ path: 'test-results/06-after-questionnaire.png', fullPage: true });

  // Check current URL
  const pageUrl = page.url();
  console.log(`Current URL: ${pageUrl}`);

  // Now we should be on trip page with city selection
  // Look for city cards
  await page.waitForTimeout(2000);

  const cityCards = page.locator('[class*="rounded"]').filter({ hasText: /Tokyo|Kyoto|Osaka|Bangkok|Chiang Mai|Istanbul/i });
  const cityCount = await cityCards.count();
  console.log(`Found ${cityCount} potential city cards`);

  if (cityCount > 0) {
    // Click on a city card to open modal
    await cityCards.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/07-city-modal.png', fullPage: true });

    // Check for dot ratings
    console.log(`Calm visible: ${await page.locator('text=Calm').isVisible().catch(() => false)}`);
    console.log(`Wow visible: ${await page.locator('text=Wow').isVisible().catch(() => false)}`);

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Check for Route Options section
  const routeOptions = page.locator('text=Route Options');
  console.log(`Route Options visible: ${await routeOptions.isVisible().catch(() => false)}`);

  // Check for country order
  const countryOrder = page.locator('text=Country order');
  console.log(`Country order visible: ${await countryOrder.isVisible().catch(() => false)}`);

  await page.screenshot({ path: 'test-results/08-final.png', fullPage: true });
});
