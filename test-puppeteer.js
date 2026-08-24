const puppeteer = require('puppeteer-core');
const fs = require('fs');
// find local chrome path
const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
];
let exePath = chromePaths.find(p => fs.existsSync(p));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: exePath,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.exposeFunction('onPdfGeneratedBase64', (b64) => {
    console.log("PDF GENERATED! Length:", b64.length);
    process.exit(0);
  });
  
  console.log("Navigating...");
  await page.goto("https://libero-management.vercel.app/shipping-scanner/bulk-mini-perfume?store=libero&orderIds=54341", { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log("Loaded. Waiting for generation...");
  
  setTimeout(() => {
    console.log("TIMEOUT");
    process.exit(1);
  }, 10000);
})();
