import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR STACK:', err.stack));

  // let's try to mock auth or just see if the login page throws.
  await page.goto('http://localhost:3000/?mode=login');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const errorText = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT:", errorText);
  await browser.close();
})();
