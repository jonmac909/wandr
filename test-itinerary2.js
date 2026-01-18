const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  console.log('Navigating to trippified.com/plan...');
  await page.goto('https://trippified.com/plan');
  await page.waitForTimeout(2000);
  
  // Take screenshot to see current state
  await page.screenshot({ path: 'step1.png' });
  console.log('Screenshot saved to step1.png');
  
  // Check what's on the page
  const text = await page.textContent('body');
  console.log('Page text (first 500 chars):', text.substring(0, 500));
  
  // Look for any buttons or navigation
  const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent?.trim()).filter(Boolean));
  console.log('Buttons found:', buttons.slice(0, 20));
  
  await page.waitForTimeout(30000); // Keep browser open to inspect
  await browser.close();
})();
