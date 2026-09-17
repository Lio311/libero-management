const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');

async function capturePdf(url, filename) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1200, height: 800 },
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  await page.evaluateOnNewDocument(() => {
    window.__pdfReady = false;
    window.__pdfBase64 = null;
    window.print = function () {};
    const origCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (obj) {
      const blobUrl = origCreateObjectURL(obj);
      if (obj instanceof Blob && obj.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = function () {
          window.__pdfBase64 = reader.result.split(',')[1];
          window.__pdfReady = true;
        };
        reader.readAsDataURL(obj);
      }
      return blobUrl;
    };
  });
  
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
  await page.waitForFunction('window.__pdfReady === true', { timeout: 10000 });
  
  const base64 = await page.evaluate(() => window.__pdfBase64);
  await browser.close();
  
  fs.writeFileSync(filename, Buffer.from(base64, 'base64'));
  console.log(`Saved ${filename}`);
}

async function run() {
  await capturePdf('https://members.lionwheel.com/tasks/print_public_label.pdf?public_id=MRNBTZQHSO', 'top-label.pdf');
}
run();
