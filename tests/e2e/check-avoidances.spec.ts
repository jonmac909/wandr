import { test, expect } from '@playwright/test';

test('plan page has new avoidance options', async ({ page }) => {
  await page.goto('https://wandr.jon-c95.workers.dev/plan');

  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Step 1: Enter a destination (countries/regions input)
  const destinationInput = page.getByPlaceholder(/Thailand, Vietnam, Japan/i);
  await destinationInput.fill('France');
  // Press Enter to add the destination
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  // Click Next to go to step 2
  await page.getByRole('button', { name: /Next/i }).first().click();
  await page.waitForTimeout(500);

  // Click Next to go to step 3 (Preferences)
  await page.getByRole('button', { name: /Next/i }).click();
  await page.waitForTimeout(500);

  // Check for the new avoidance options
  const newOptions = [
    'Polluted/Dirty areas',
    'Rude service',
    'Noisy environments',
    'Long waits',
    'Disorganized places',
  ];

  for (const option of newOptions) {
    const button = page.getByRole('button', { name: option });
    await expect(button).toBeVisible({ timeout: 10000 });
    console.log(`Found: ${option}`);
  }

  // Also check temperature labels are updated
  await expect(page.getByRole('button', { name: /Hot weather.*35/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Cold weather.*10/ })).toBeVisible();
});
