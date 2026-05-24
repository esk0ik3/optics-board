import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url()));
  
  console.log('Navigating to live site...');
  await page.goto('https://esk0ik3.github.io/optics-board/', { waitUntil: 'networkidle0' });
  
  console.log('Page loaded. Waiting 8 seconds to see what happens...');
  await new Promise(r => setTimeout(r, 8000));
  
  console.log('Checking if tldraw UI is still there...');
  const hasToolbar = await page.evaluate(() => {
    return !!document.querySelector('.tlui-layout');
  });
  console.log('Has toolbar?', hasToolbar);

  await browser.close();
})();
