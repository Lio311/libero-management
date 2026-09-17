const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');

async function capturePdf(url) {
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
  
  fs.writeFileSync('captured.pdf', Buffer.from(base64, 'base64'));
  console.log('Saved captured.pdf');
}

async function fixPdf() {
  const { PDFDocument, rgb } = require('pdf-lib');
  const pdfBuffer = fs.readFileSync('captured.pdf');
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  
  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    console.log('Original PDF Size:', width, height);
    if (width > height) {
      console.log('Fixing landscape...');
      const targetWidth = height;
      const targetHeight = width;
      const scale = (targetWidth * 0.96) / width; 
      page.setSize(targetWidth, targetHeight);
      page.scaleContent(scale, scale);
      const xOffset = (targetWidth - (width * scale)) / 2;
      const contentHeight = height * scale;
      const topMargin = targetHeight * 0.02;
      const yOffset = targetHeight - contentHeight - topMargin;
      page.translateContent(xOffset, yOffset);
      page.drawCircle({ x: 1, y: 1, size: 0.1, color: rgb(0,0,0) });
      page.drawCircle({ x: targetWidth - 1, y: targetHeight - 1, size: 0.1, color: rgb(0,0,0) });
    }
  }
  
  fs.writeFileSync('captured-fixed.pdf', await pdfDoc.save());
  console.log('Saved captured-fixed.pdf');
}

async function run() {
  try {
    await capturePdf('https://members.lionwheel.com/tasks/print_public_label.pdf?public_id=YXVSNLRKCC');
    await fixPdf();
  } catch (e) {
    console.error(e);
  }
}
run();
