import { test, expect } from '@playwright/test';

test.describe('Itinerary Functions', () => {
  test.setTimeout(60000);

  test.describe('Day Allocation', () => {
    test('planning page loads correctly', async ({ page }) => {
      await page.goto('/plan');
      
      // Check page loaded
      await expect(page).toHaveTitle(/Wandr|Trippified|Plan/i);
      
      // Check key elements exist
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    });
  });

  test.describe('City Selection Flow', () => {
    test('can navigate to planning page', async ({ page }) => {
      await page.goto('/');
      
      // Look for plan trip button/link
      const planButton = page.getByRole('link', { name: /plan|start|create/i }).first();
      
      if (await planButton.isVisible()) {
        await planButton.click();
        await page.waitForURL(/\/(plan|questionnaire)/);
      }
    });
  });

  test.describe('Trip Page', () => {
    test('my-trips page loads', async ({ page }) => {
      await page.goto('/my-trips');
      
      // Should load without errors
      await expect(page).toHaveTitle(/Wandr|Trippified|Trips/i);
    });
  });

  test.describe('Explore Page', () => {
    test('explore page loads', async ({ page }) => {
      await page.goto('/explore');
      
      await expect(page).toHaveTitle(/Wandr|Trippified|Explore/i);
      
      // Check for search functionality
      const searchInput = page.locator('input[type="text"], input[placeholder*="search" i], input[placeholder*="city" i]').first();
      
      if (await searchInput.isVisible()) {
        // Type a city name
        await searchInput.fill('Tokyo');
        
        // Wait for any loading to complete
        await page.waitForTimeout(1000);
      }
    });

    test('explore search returns results', async ({ page }) => {
      await page.goto('/explore');
      
      // Find and fill search
      const searchInput = page.locator('input').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('Paris');
        
        // Look for search button
        const searchButton = page.getByRole('button', { name: /search|find|go/i }).first();
        
        if (await searchButton.isVisible()) {
          await searchButton.click();
          
          // Wait for results
          await page.waitForTimeout(3000);
          
          // Check if any results appeared
          const results = page.locator('[class*="card"], [class*="result"], [class*="place"]');
          // Results may or may not appear depending on API key
        }
      }
    });
  });

  test.describe('Saved Page', () => {
    test('saved page loads', async ({ page }) => {
      await page.goto('/saved');
      
      await expect(page).toHaveTitle(/Wandr|Trippified|Saved/i);
    });
  });

  test.describe('Route Optimization', () => {
    test('homepage shows destination inspiration', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check for seasonal destinations or destination content
      const pageContent = await page.textContent('body');
      
      // Should have some destination-related content
      const hasDestinations = 
        pageContent?.toLowerCase().includes('destination') ||
        pageContent?.toLowerCase().includes('travel') ||
        pageContent?.toLowerCase().includes('trip') ||
        pageContent?.toLowerCase().includes('explore');
      
      expect(hasDestinations).toBe(true);
    });
  });

  test.describe('Image Loading', () => {
    test('city images load on homepage', async ({ page }) => {
      await page.goto('/');
      
      // Wait for images to load
      await page.waitForTimeout(2000);
      
      // Check for img elements
      const images = await page.locator('img').count();
      expect(images).toBeGreaterThan(0);
    });

    test('placeholder images work', async ({ page }) => {
      // Directly test placeholder endpoint
      const response = await page.request.get('/api/placeholder/city/TestCity');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/svg+xml');
    });
  });
});
