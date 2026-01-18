const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to trippified.com/plan...');
  await page.goto('https://trippified.com/plan');
  await page.waitForTimeout(3000);
  
  // Click through steps to get to itinerary
  // First check what step we're on
  const pageContent = await page.content();
  console.log('Page loaded, checking for itinerary...');
  
  // Look for image sources
  const images = await page.$$eval('img', imgs => imgs.map(img => ({
    src: img.src,
    alt: img.alt
  })));
  
  console.log('Found images:', JSON.stringify(images.slice(0, 10), null, 2));
  
  // Check for the mock pexels URL
  const pexelsImages = images.filter(img => img.src.includes('pexels'));
  console.log('Pexels images found:', pexelsImages.length);
  
  if (pexelsImages.length > 0) {
    console.log('Pexels URLs:', pexelsImages);
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();
