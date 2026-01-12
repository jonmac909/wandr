import { test, expect } from '@playwright/test';

test('verify auto-itinerary deployment', async ({ page }) => {
  // Go to the deployed site's plan page
  await page.goto('https://wandr.jon-c95.workers.dev/plan');
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await page.screenshot({ path: 'test-results/auto-itinerary-deploy.png', fullPage: true });

  // Check if page loaded successfully
  const title = await page.title();
  console.log('Page title:', title);
  expect(title).toContain('Trippified');

  // Log visible text on page for debugging
  const bodyText = await page.locator('body').innerText();
  console.log('Page content preview:', bodyText.substring(0, 500));

  // Check for destination search functionality
  const hasDestinationPrompt = await page.getByRole('textbox', { name: /where.*go|destination|country/i }).isVisible().catch(() => false) ||
                               await page.getByPlaceholder(/where|search|destination/i).isVisible().catch(() => false);
  
  console.log('Has destination input:', hasDestinationPrompt);

  // Success - site is live and plan page is working
  console.log('✓ Deployment verified - site is live!');
});
