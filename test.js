import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
  
  console.log('Navigating...');
  await page.goto('http://localhost:4173/');
  
  console.log('Waiting 6 seconds...');
  await new Promise(r => setTimeout(r, 6000));
  
  console.log('Clicking the 150 lens button...');
  // Find the button with text "両凸レンズ"
  const handles = await page.$$('button');
  for (const h of handles) {
    const text = await page.evaluate(el => el.textContent, h);
    if (text && text.includes('両凸レンズ')) {
      await h.click();
      console.log('Clicked!');
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();
