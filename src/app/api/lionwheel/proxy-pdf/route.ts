import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { PDFDocument } from 'pdf-lib';

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
      headless: (chromium as any).headless as any,
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.evaluateOnNewDocument(() => {
      (window as any).__pdfReady = false;
      (window as any).__pdfBase64 = null;
      window.print = function () {};
      const origCreateObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (obj: any) {
        const blobUrl = origCreateObjectURL(obj);
        if (obj instanceof Blob && obj.type === 'application/pdf') {
          const reader = new FileReader();
          reader.onload = function () {
            if (typeof reader.result === 'string') {
               (window as any).__pdfBase64 = reader.result.split(',')[1];
               (window as any).__pdfReady = true;
            }
          };
          reader.readAsDataURL(obj);
        }
        return blobUrl;
      };
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.waitForFunction('(window as any).__pdfReady === true', { timeout: 10000 });
    
    const base64 = await page.evaluate(() => (window as any).__pdfBase64);
    if (!base64) {
      throw new Error("No PDF generated");
    }

    const pdfBuffer = Buffer.from(base64 as string, 'base64');
    
    const origDoc = await PDFDocument.load(pdfBuffer);
    const newDoc = await PDFDocument.create();
    
    const embeddedPages = await newDoc.embedPdf(pdfBuffer);
    
    for (let i = 0; i < embeddedPages.length; i++) {
      const origPage = origDoc.getPages()[i];
      const { width, height } = origPage.getSize();
      
      const newPage = newDoc.addPage([width, height]);
      const embeddedPage = embeddedPages[i];
      
      const scale = 0.90;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      
      // Shift more to the right: 20 points
      const x = ((width - scaledWidth) / 2) + 20;
      const y = (height - scaledHeight) / 2;
      
      newPage.drawPage(embeddedPage, {
        x,
        y,
        xScale: scale,
        yScale: scale,
      });
    }
    
    const fixedPdfBytes = await newDoc.save();

    return new NextResponse(Buffer.from(fixedPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="label.pdf"',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error('Error proxying PDF:', error);
    // DO NOT REDIRECT! Return a 500 error so the daemon crashes and we know there's an error!
    return new NextResponse('Internal Error Proxying PDF: ' + error.message, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
