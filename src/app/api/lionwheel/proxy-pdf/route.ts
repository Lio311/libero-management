import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  let browser = null;

  try {
    console.log('[proxy-pdf] Launching headless browser for:', url);

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1200, height: 800 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set desktop user agent so Lionwheel renders the label normally
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Before the page loads, inject interceptors:
    // 1. Suppress window.print() so the print dialog doesn't block
    // 2. Intercept URL.createObjectURL to capture the PDF blob that pdfMake generates
    await page.evaluateOnNewDocument(() => {
      const w = window as any;
      w.__pdfReady = false;
      w.__pdfBase64 = null;

      // Suppress print dialog
      w.print = function () {};

      // Intercept PDF blob creation
      const origCreateObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (obj: any) {
        const blobUrl = origCreateObjectURL(obj);
        if (obj instanceof Blob && obj.type === 'application/pdf') {
          const reader = new FileReader();
          reader.onload = function () {
            w.__pdfBase64 = (reader.result as string).split(',')[1];
            w.__pdfReady = true;
          };
          reader.readAsDataURL(obj);
        }
        return blobUrl;
      };
    });

    // Navigate to the Lionwheel label page
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 20000,
    });

    // Wait for the PDF blob to be captured (max 10 seconds)
    await page.waitForFunction('window.__pdfReady === true', {
      timeout: 10000,
    });

    // Extract the base64-encoded PDF
    const base64: string = await page.evaluate(() => (window as any).__pdfBase64);

    if (!base64) {
      throw new Error('Failed to capture PDF data');
    }

    console.log('[proxy-pdf] PDF captured successfully, size:', base64.length, 'chars');

    const pdfBuffer = Buffer.from(base64, 'base64');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="shipping-label.pdf"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[proxy-pdf] Error:', error?.message || error);
    // Fallback: redirect to original URL so the user still gets something
    return NextResponse.redirect(url);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
