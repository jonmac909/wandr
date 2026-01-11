import { test, expect } from '@playwright/test';

test.describe('5-Section Planning Flow', () => {
  test('navigates through all 5 sections', async ({ page }) => {
    // Go to the plan page
    await page.goto('http://localhost:3002/plan');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/5s-01-section1-where.png', fullPage: true });

    // Verify we're on Section 1: Where & When
    // Check for the 5-step nav
    const navButtons = page.locator('button').filter({ hasText: /Where|Prefs|Cities|Route|Itin/i });
    const navCount = await navButtons.count();
    console.log(`Found ${navCount} nav buttons`);

    // Check for origin input
    const originInput = page.getByPlaceholder(/Vancouver|Los Angeles/i);
    expect(await originInput.isVisible()).toBeTruthy();

    // Fill in destination and press Enter to add it
    const destinationInput = page.getByPlaceholder(/Thailand|Vietnam|Japan/i);
    if (await destinationInput.isVisible()) {
      await destinationInput.fill('Japan');
      await destinationInput.press('Enter'); // Press Enter to add
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'test-results/5s-02-added-japan.png', fullPage: true });

    // Click Next to go to Section 2: Preferences
    const nextButton = page.getByRole('main').getByRole('button', { name: 'Next' });
    await nextButton.scrollIntoViewIfNeeded();
    await expect(nextButton).toBeEnabled({ timeout: 5000 });
    await nextButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/5s-03-section2-prefs.png', fullPage: true });

    // Verify Section 2: Preferences - Check for two-column layout items
    const budgetSection = page.locator('.font-medium').filter({ hasText: 'Budget' }).first();
    const paceSection = page.locator('.font-medium').filter({ hasText: 'Pace' }).first();
    const lodgingSection = page.locator('.font-medium').filter({ hasText: 'Lodging' }).first();
    const areaSection = page.locator('.font-medium').filter({ hasText: /^Area$/ }).first();
    const interestsSection = page.locator('.font-medium').filter({ hasText: 'Interests' }).first();
    const avoidSection = page.locator('.font-medium').filter({ hasText: 'Things to avoid' }).first();

    console.log('Budget visible:', await budgetSection.isVisible());
    console.log('Pace visible:', await paceSection.isVisible());
    console.log('Lodging visible:', await lodgingSection.isVisible());
    console.log('Area visible:', await areaSection.isVisible());
    console.log('Interests visible:', await interestsSection.isVisible());
    console.log('Things to avoid visible:', await avoidSection.isVisible());

    // Select an interest (required to proceed)
    const beachButton = page.locator('button').filter({ hasText: 'Beach' });
    if (await beachButton.isVisible()) {
      await beachButton.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: 'test-results/5s-04-selected-interest.png', fullPage: true });

    // Click Save & Pick Cities to go to Section 3
    const saveButton = page.locator('button').filter({ hasText: /Save.*Cities/i });
    console.log('Save button visible:', await saveButton.isVisible());
    console.log('Save button enabled:', await saveButton.isEnabled());

    if (await saveButton.isVisible() && await saveButton.isEnabled()) {
      await saveButton.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/5s-05-section3-cities.png', fullPage: true });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after save:', currentUrl);

    // Check if we're now in Section 3: Cities (city picker should be visible)
    // The SwipeablePlanningView should be rendered
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/5s-06-final.png', fullPage: true });
  });

  test('two-column layout in Section 2', async ({ page }) => {
    await page.goto('http://localhost:3002/plan');
    await page.waitForTimeout(2000);

    // Add destination and go to Section 2
    const destinationInput = page.getByPlaceholder(/Thailand|Vietnam|Japan/i);
    if (await destinationInput.isVisible()) {
      await destinationInput.fill('Thailand');
      const plusButton = page.locator('button svg.lucide-plus').locator('xpath=ancestor::button').first();
      if (await plusButton.isVisible()) await plusButton.click();
    }

    const nextButton = page.locator('button').filter({ hasText: 'Next' }).first();
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/5s-layout-prefs.png', fullPage: true });

    // Check for two-column grid layout
    // Budget and Pace should be side by side
    // Lodging and Area should be side by side
    const gridContainers = page.locator('.grid.grid-cols-2');
    const gridCount = await gridContainers.count();
    console.log(`Found ${gridCount} two-column grids`);
    expect(gridCount).toBeGreaterThanOrEqual(2); // Budget/Pace and Lodging/Area

    // Check that there are no collapsible sections (no ChevronDown/ChevronUp icons)
    const chevrons = page.locator('svg.lucide-chevron-down, svg.lucide-chevron-up');
    const chevronCount = await chevrons.count();
    console.log(`Found ${chevronCount} chevron icons (should be 0 for no collapsibles)`);
  });

  test('nav becomes clickable after completing sections', async ({ page }) => {
    await page.goto('http://localhost:3002/plan');
    await page.waitForTimeout(2000);

    // Initially, only Section 1 should be active/clickable
    // Section 3, 4, 5 should be disabled

    // Try clicking on Cities nav (should be disabled)
    const citiesNav = page.locator('button').filter({ hasText: 'Cities' });
    if (await citiesNav.isVisible()) {
      const isDisabled = await citiesNav.isDisabled();
      console.log('Cities nav disabled initially:', isDisabled);
      // It should be disabled or have opacity-50 class
    }

    await page.screenshot({ path: 'test-results/5s-nav-initial.png', fullPage: true });
  });
});
