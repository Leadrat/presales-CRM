const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Testing login flow...');

  // Navigate to login page
  await page.goto('http://148.113.37.231/presales/login', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(2000);

  console.log('Current URL:', page.url());

  // Fill in credentials
  await page.fill('input[type="email"]', 'shashank@leadrat.com');
  await page.fill('input[type="password"]', 'Shashank@12');

  // Take screenshot before login
  await page.screenshot({ path: 'presales-before-login.png' });
  console.log('Screenshot saved to presales-before-login.png');

  // Click sign in button
  await page.click('button:has-text("Sign in")');

  // Wait for navigation after login
  await page.waitForTimeout(3000);

  console.log('After login URL:', page.url());

  // Take screenshot after login
  await page.screenshot({ path: 'presales-after-login.png' });
  console.log('Screenshot saved to presales-after-login.png');

  await browser.close();
  console.log('Test completed!');
})();
