import { test, expect } from '@playwright/test';

test('check interests counter on live site', async ({ page }) => {
  await page.goto('https://wandr.jon-c95.workers.dev/plan');
  await page.waitForLoadState('networkidle');

  // Go to step 2
  const step2Button = page.locator('button').filter({ hasText: 'Trip Style' });
  await step2Button.click();
  await page.waitForTimeout(500);

  // Take screenshot of step 2
  await page.screenshot({ path: 'step2-interests.png', fullPage: true });

  // Check if interests section exists and what count it shows
  const interestsSection = page.locator('text=Interests');
  await expect(interestsSection).toBeVisible();

  // Get any "selected" text
  const selectedText = page.locator('text=/\\d+ selected/');
  const count = await selectedText.count();
  console.log('Number of "selected" indicators found:', count);

  if (count > 0) {
    const text = await selectedText.first().textContent();
    console.log('Selected text:', text);
  }
});
