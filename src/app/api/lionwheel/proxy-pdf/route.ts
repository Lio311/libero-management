import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { PDFDocument, degrees } from 'pdf-lib';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1200, height: 800 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
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

    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.waitForFunction('window.__pdfReady === true', { timeout: 10000 });
    
    const base64 = await page.evaluate(() => window.__pdfBase64);
    if (!base64) {
      throw new Error("No PDF generated");
    }

    const pdfBuffer = Buffer.from(base64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    for (const p of pdfDoc.getPages()) {
      // Rotate 90 degrees, BUT we also might need to scale it slightly if it cuts off edges
      // Let's just rotate 90 for now, because the original PDF is perfectly sized.
      const currentRotation = p.getRotation().angle;
      p.setRotation(degrees(currentRotation + 90));
    }
    
    const fixedPdfBytes = await pdfDoc.save();

    return new NextResponse(fixedPdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="label.pdf"',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error('Error proxying PDF:', error);
    return NextResponse.redirect(targetUrl);
  } finally {
    if (browser) await browser.close();
  }
}
