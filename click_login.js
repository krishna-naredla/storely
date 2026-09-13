import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR STACK:', err.stack));

  await page.goto('http://localhost:3000/');
  await new Promise(r => setTimeout(r, 2000));
  
  // click login button
  console.log("Clicking login...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.innerText.includes('Login'));
    if (loginBtn) loginBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  const errorText = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT AFTER CLICK:", errorText);
  await browser.close();
})();
