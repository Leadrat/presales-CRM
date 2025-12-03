const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Track all redirects
  const redirects = [];
  page.on('response', response => {
    const status = response.status();
    if (status >= 300 && status < 400) {
      redirects.push({
        url: response.url(),
        status: status,
        location: response.headers()['location']
      });
    }
  });

  // Check for any console messages
  page.on('console', msg => {
    console.log(`Console [${msg.type()}]:`, msg.text());
  });

  console.log('Navigating to presales login page...');

  try {
    await page.goto('http://148.113.37.231/presales/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
  } catch (e) {
    console.log('Navigation error:', e.message);
  }

  console.log('Final URL:', page.url());
  console.log('Page title:', await page.title());
  console.log('Redirects:', JSON.stringify(redirects, null, 2));

  // Take screenshot
  await page.screenshot({ path: 'presales-screenshot.png' });
  console.log('Screenshot saved to presales-screenshot.png');

  // Wait a bit more
  await page.waitForTimeout(3000);

  await browser.close();
  console.log('Test completed!');
})();
