import { test, expect } from '@playwright/test';

test('verify plan page progress indicator locally', async ({ page }) => {
  // Go to live deployed site
  await page.goto('https://wandr.jon-c95.workers.dev/plan');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await page.screenshot({ path: 'plan-page-screenshot.png', fullPage: true });

  // Check step 1 heading is visible
  const step1Heading = page.getByRole('heading', { name: 'Where are you going?' });
  await expect(step1Heading).toBeVisible();
  console.log('Step 1 heading visible');

  // Check for progress indicator steps
  const stepButtons = page.locator('button:has-text("Where & When"), button:has-text("Trip Style"), button:has-text("Preferences")');
  const stepCount = await stepButtons.count();
  console.log('Step buttons found:', stepCount);

  // Check step 1 exists and is clickable
  const step1 = page.locator('button').filter({ hasText: 'Where & When' });
  await expect(step1).toBeVisible();

  // Check step 2 exists and is clickable
  const step2 = page.locator('button').filter({ hasText: 'Trip Style' });
  await expect(step2).toBeVisible();

  // Check step 3 exists and is clickable
  const step3 = page.locator('button').filter({ hasText: 'Preferences' });
  await expect(step3).toBeVisible();

  // Try clicking step 2 directly
  await step2.click();
  await page.waitForTimeout(500);

  // Take screenshot after clicking step 2
  await page.screenshot({ path: 'plan-page-step2.png', fullPage: true });

  // Try clicking step 3 directly
  await step3.click();
  await page.waitForTimeout(500);

  // Take screenshot after clicking step 3
  await page.screenshot({ path: 'plan-page-step3.png', fullPage: true });

  console.log('All steps are clickable!');
});
