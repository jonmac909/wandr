import { test, expect } from '@playwright/test';

test('find all broken images on trip page', async ({ page }) => {
  // Go to the trip page
  await page.goto('https://wandr.jon-c95.workers.dev/trip/38af4399-2780-4ff5-a906-411835198f56');

  // Wait for network to be idle and content to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(8000); // Wait extra time for dynamic content

  // Scroll down to load all images
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: 'test-results/trip-page-images.png', fullPage: true });

  // Log page content to debug
  const bodyText = await page.locator('body').textContent();
  console.log('Page text preview:', bodyText?.slice(0, 500));

  // Find all img elements
  const images = await page.locator('img').all();
  console.log(`\n=== Found ${images.length} images on page ===\n`);

  const brokenImages: string[] = [];

  for (const img of images) {
    const src = await img.getAttribute('src');
    const alt = await img.getAttribute('alt') || 'no alt';

    if (!src) {
      console.log(`❌ MISSING SRC: ${alt}`);
      brokenImages.push(`MISSING SRC: ${alt}`);
      continue;
    }

    // Check naturalWidth to see if image loaded
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);

    if (naturalWidth === 0) {
      console.log(`❌ BROKEN: ${alt}`);
      console.log(`   URL: ${src}\n`);
      brokenImages.push(`${alt}: ${src}`);
    } else {
      console.log(`✅ OK: ${alt}`);
    }
  }

  console.log(`\n=== BROKEN IMAGES: ${brokenImages.length} ===`);
  brokenImages.forEach(img => console.log(img));
});

test('list all image URLs and test them', async ({ page }) => {
  await page.goto('https://wandr.jon-c95.workers.dev/trip/38af4399-2780-4ff5-a906-411835198f56');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(8000);

  // Scroll to load all content
  for (let i = 0; i < 5; i++) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), i * 500);
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: 'test-results/full-page.png', fullPage: true });

  // Get all img src URLs
  const imgUrls = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map(img => ({
      src: img.src,
      alt: img.alt || img.getAttribute('alt') || 'no-alt',
      loaded: img.complete && img.naturalWidth > 0
    }));
  });

  console.log(`\nFound ${imgUrls.length} images:\n`);

  const broken: string[] = [];
  const working: string[] = [];

  for (const img of imgUrls) {
    if (img.loaded) {
      console.log(`✅ ${img.alt}: loaded OK`);
      working.push(img.alt);
    } else {
      console.log(`❌ ${img.alt}: BROKEN`);
      console.log(`   ${img.src}`);
      broken.push(img.alt);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Working: ${working.length}`);
  console.log(`Broken: ${broken.length}`);

  if (broken.length > 0) {
    console.log('\nBroken cities:');
    broken.forEach(b => console.log(`  - ${b}`));
  }
});
